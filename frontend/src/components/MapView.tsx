import L from 'leaflet'
// @ts-ignore
import MarkerClusterGroup from 'react-leaflet-cluster'

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Leaflet default icon URL shim
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

import { useMemo } from 'react'
import { MapContainer, Marker, Popup, TileLayer, Polyline, Tooltip } from 'react-leaflet'

import type { Driver } from './DriversPanel'

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

export function MapView({
  drivers,
  activeOrders = [],
}: MapViewProps) {
  const center: [number, number] = [31.5204, 74.3587]

  // Routes data
  const routes = useMemo(() => {
    return activeOrders.map((order) => {
      const driver = drivers.find((d) => d.id === order.driver_id)
      if (!driver) return null

      // Purple = Driver to Restaurant (assigned)
      // Teal = Restaurant to Customer (delivering/picked_up)
      const color = order.status === 'assigned' ? '#6c63ff' : '#00d4aa'
      const dashArray = driver.is_in_traffic ? '5, 10' : undefined
      const weight = driver.is_in_traffic ? 4 : 3
      const opacity = driver.is_in_traffic ? 0.6 : 0.8

      const positions: [number, number][] = []
      positions.push([driver.lat, driver.lng])
      
      if (order.status === 'assigned') {
        positions.push([order.pickup_lat, order.pickup_lng])
      } else {
        positions.push([order.dropoff_lat, order.dropoff_lng])
      }

      return {
        id: order.id,
        positions,
        color: driver.is_in_traffic ? '#ef4444' : color,
        dashArray,
        weight,
        opacity,
      }
    }).filter(Boolean)
  }, [activeOrders, drivers])

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
        center={center}
        zoom={13}
        className="z-0 h-full w-full min-h-0"
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url={CARTO_DARK_MATTER}
        />

        <MarkerClusterGroup chunkedLoading>
          {drivers.map((d) => (
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
        </MarkerClusterGroup>

        {activeOrders.map((o: any) => {
          if (!o.pickup_lat || !o.pickup_lng) return null
          return (
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
          )
        })}

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
