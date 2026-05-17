import L from 'leaflet'
// @ts-ignore
import MarkerClusterGroup from 'react-leaflet-cluster'
import { useMemo, useState, useEffect, useRef } from 'react'
import { MapContainer, Marker, Popup, TileLayer, Polyline, Tooltip, useMapEvents } from 'react-leaflet'

import type { Driver } from './DriversPanel'

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Leaflet default icon URL shim
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

/** CartoDB Dark Matter (Carto dark basemap). */
const CARTO_DARK_MATTER =
  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'

function driverIcon(status: Driver['status'], isInTraffic?: boolean): L.DivIcon {
  const color = isInTraffic ? '#ef4444' : status === 'available' ? '#00d4aa' : '#6c63ff'
  return L.divIcon({
    className: 'utosolver-marker driver-marker',
    html: `<div class="marker-pulse" style="background:${color}33"></div>
           <div style="width:14px;height:14px;border-radius:9999px;background:${color};border:2px solid #0f0f1a;box-shadow:0 0 0 2px ${color}55"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10],
  })
}

function orderIcon(status: string): L.DivIcon {
  const color =
    status === 'assigned'
      ? '#6c63ff'
      : status === 'pending'
        ? '#fbbf24'
        : status === 'cancelled'
          ? '#ef4444'
          : '#22c55e'
  return L.divIcon({
    className: 'utosolver-marker order-marker',
    html: `<div style="width:12px;height:12px;border-radius:4px;background:${color};border:2px solid #0f0f1a;transform:rotate(45deg);box-shadow:0 0 0 2px ${color}44"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10],
  })
}

interface MapViewProps {
  drivers: Driver[]
  orders: any[]
  activeOrders?: any[]
}

// Helper to calculate distance for route limiting
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  return Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lon2 - lon1, 2))
}

function MapStateTracker({ 
  setBounds, 
  setCenter 
}: { 
  setBounds: (b: L.LatLngBounds) => void, 
  setCenter: (c: L.LatLng) => void 
}) {
  const map = useMapEvents({
    moveend: () => {
      setBounds(map.getBounds())
      setCenter(map.getCenter())
    },
    zoomend: () => {
      setBounds(map.getBounds())
      setCenter(map.getCenter())
    },
  })

  // Initial bounds
  useEffect(() => {
    setBounds(map.getBounds())
    setCenter(map.getCenter())
  }, [map, setBounds, setCenter])

  return null
}

export function MapView({
  drivers,
  activeOrders = [],
}: MapViewProps) {
  const initialCenter: [number, number] = [38.4167, 112.7333]
  const [bounds, setBounds] = useState<L.LatLngBounds | null>(null)
  const [mapCenter, setMapCenter] = useState<L.LatLng | null>(null)

  // Debounced update for performance (Max 2 FPS)
  const [deferredBounds, setDeferredBounds] = useState<L.LatLngBounds | null>(null)
  const [deferredCenter, setDeferredCenter] = useState<L.LatLng | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDeferredBounds(bounds)
      setDeferredCenter(mapCenter)
    }, 500)
    return () => clearTimeout(timer)
  }, [bounds, mapCenter])

  // OSRM road-following route coordinates, keyed by order ID
  const [routeCoords, setRouteCoords] = useState<Record<number, [number, number][]>>({})
  const fetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Debounce to avoid hammering OSRM on every simulation tick
    if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current)
    fetchTimerRef.current = setTimeout(async () => {
      const results: Record<number, [number, number][]> = {}

      await Promise.all(
        activeOrders.map(async (order) => {
          const driver = drivers.find((d) => d.id === order.driver_id)
          if (!driver) return

          const dLat = driver.lat
          const dLng = driver.lng
          const oLat = order.status === 'assigned' ? order.pickup_lat : order.dropoff_lat
          const oLng = order.status === 'assigned' ? order.pickup_lng : order.dropoff_lng

          // Skip invalid / zero coordinates
          if (!dLat || !dLng || !oLat || !oLng) return

          try {
            const url = `https://router.project-osrm.org/route/v1/driving/${dLng},${dLat};${oLng},${oLat}?overview=full&geometries=geojson`
            const res = await fetch(url)
            if (!res.ok) return
            const data = await res.json()
            const coords: [number, number][] = data?.routes?.[0]?.geometry?.coordinates?.map(
              ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
            )
            if (coords && coords.length > 0) {
              results[order.id] = coords
            }
          } catch {
            // Network error – silently skip; straight-line fallback used
          }
        })
      )

      setRouteCoords((prev) => ({ ...prev, ...results }))
    }, 300)

    return () => {
      if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current)
    }
  }, [activeOrders, drivers])

  // Filter markers by bounds
  const visibleDrivers = useMemo(() => {
    if (!deferredBounds) return drivers
    return drivers.filter(d => deferredBounds.contains([d.lat, d.lng]))
  }, [drivers, deferredBounds])

  const visibleOrders = useMemo(() => {
    if (!deferredBounds) return activeOrders
    return activeOrders.filter(o => {
      const lat = o.status === 'assigned' ? o.pickup_lat : o.dropoff_lat
      const lng = o.status === 'assigned' ? o.pickup_lng : o.dropoff_lng
      return lat && lng && deferredBounds.contains([lat, lng])
    })
  }, [activeOrders, deferredBounds])

  // Routes – use OSRM coords when available, straight-line fallback otherwise
  const routes = useMemo(() => {
    const allRoutes = activeOrders.map((order) => {
      const driver = drivers.find((d) => d.id === order.driver_id)
      if (!driver) return null

      const color = order.status === 'assigned' ? '#6c63ff' : '#00d4aa'
      const dashArray = driver.is_in_traffic ? '5, 10' : undefined
      const weight = driver.is_in_traffic ? 4 : 3
      const opacity = driver.is_in_traffic ? 0.6 : 0.8

      // Use road-following OSRM path if available; fall back to straight line
      const osrmPositions = routeCoords[order.id]
      let positions: [number, number][]
      if (osrmPositions && osrmPositions.length > 1) {
        positions = osrmPositions
      } else {
        positions = [[driver.lat, driver.lng]]
        if (order.status === 'assigned') {
          positions.push([order.pickup_lat, order.pickup_lng])
        } else {
          positions.push([order.dropoff_lat, order.dropoff_lng])
        }
      }

      // Calculate distance to map center for priority sorting
      const dist = deferredCenter
        ? getDistance(driver.lat, driver.lng, deferredCenter.lat, deferredCenter.lng)
        : 0

      return {
        id: order.id,
        positions,
        color: driver.is_in_traffic ? '#ef4444' : color,
        dashArray,
        weight,
        opacity,
        dist,
      }
    }).filter(Boolean) as any[]

    // Sort by proximity to map centre and cap at 100
    return allRoutes
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 100)
  }, [activeOrders, drivers, deferredCenter, routeCoords])

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        height: '100%',
        width: '100%',
      }}
    >
      <style>{`
        .leaflet-div-icon.utosolver-marker {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-container {
          height: 100%;
          min-height: 100%;
          width: 100%;
          background: #0f0f1a;
        }
        .marker-pulse {
          position: absolute;
          width: 30px;
          height: 30px;
          left: -8px;
          top: -8px;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { transform: scale(0.5); opacity: 0.8; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        .driver-marker div, .order-marker div {
          transition: all 0.5s ease-in-out;
        }
      `}</style>
      <MapContainer
        center={initialCenter}
        zoom={13}
        className="z-0 h-full w-full min-h-0"
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
      >
        <MapStateTracker setBounds={setBounds} setCenter={setMapCenter} />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url={CARTO_DARK_MATTER}
        />

        <MarkerClusterGroup chunkedLoading spiderfyOnMaxZoom={false}>
          {visibleDrivers.map((d) => (
            <Marker
              key={`d-${d.id}`}
              position={[d.lat, d.lng]}
              icon={driverIcon(d.status, d.is_in_traffic)}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                <div className="rounded-lg bg-[#1a1a2e] p-2 text-white shadow-xl">
                  <p className="font-bold">{d.name}</p>
                  <p className="text-[10px] text-white/60">
                    Orders: {d.current_orders_count || 0}
                  </p>
                  {d.is_in_traffic && (
                    <p className="text-[10px] font-bold text-red-400">IN TRAFFIC</p>
                  )}
                </div>
              </Tooltip>
              <Popup>
                <strong>{d.name}</strong>
                <br />
                <span style={{ textTransform: 'capitalize' }}>{d.status}</span>
              </Popup>
            </Marker>
          ))}

          {visibleOrders.map((o: any) => (
            <Marker
              key={`o-${o.id}`}
              position={o.status === 'assigned' ? [o.pickup_lat, o.pickup_lng] : [o.dropoff_lat, o.dropoff_lng]}
              icon={orderIcon(o.status)}
            >
              <Popup>
                <strong>Order #{o.id}</strong>
                <br />
                {o.driver_name ? `Driver: ${o.driver_name}` : 'Unassigned'}
                <br />
                <span style={{ textTransform: 'capitalize' }}>{o.status}</span>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>

        {routes.map((route: any) => (
          <Polyline
            key={`route-${route.id}`}
            positions={route.positions}
            pathOptions={{
              color: route.color,
              weight: route.weight,
              opacity: route.opacity,
              dashArray: route.dashArray,
            }}
          />
        ))}
      </MapContainer>
    </div>
  )
}
