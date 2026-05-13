/* eslint-disable @typescript-eslint/ban-ts-comment -- leaflet has no bundled types in this project */
// @ts-nocheck
import L from 'leaflet'
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Leaflet default icon URL shim
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

import { useMemo } from 'react'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'

import type { Driver } from './DriversPanel'
import type { Order } from './OrdersPanel'

/** CartoDB Dark Matter (Carto dark basemap). */
const CARTO_DARK_MATTER =
  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'

/** Approximate Lahore-area pins for orders (data has no coordinates). */
const ORDER_POSITION: Record<number, [number, number]> = {
  1: [31.5248, 74.3565],
  2: [31.5175, 74.3635],
}

function driverIcon(status: Driver['status']): L.DivIcon {
  const color = status === 'available' ? '#00d4aa' : '#ff6b6b'
  return L.divIcon({
    className: 'utosolver-marker',
    html: `<div style="width:14px;height:14px;border-radius:9999px;background:${color};border:2px solid #0f0f1a;box-shadow:0 0 0 2px ${color}55"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10],
  })
}

function orderIcon(status: Order['status']): L.DivIcon {
  const color =
    status === 'assigned'
      ? '#6c63ff'
      : status === 'pending'
        ? '#fbbf24'
        : '#22c55e'
  return L.divIcon({
    className: 'utosolver-marker',
    html: `<div style="width:12px;height:12px;border-radius:4px;background:${color};border:2px solid #0f0f1a;transform:rotate(45deg);box-shadow:0 0 0 2px ${color}44"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10],
  })
}

export function MapView({
  drivers,
  orders,
}: {
  drivers: Driver[]
  orders: Order[]
}) {
  const center: [number, number] = [31.5204, 74.3587]

  const driverIcons = useMemo(() => {
    const m = new Map<number, L.DivIcon>()
    drivers.forEach((d) => m.set(d.id, driverIcon(d.status)))
    return m
  }, [drivers])

  const orderIcons = useMemo(() => {
    const m = new Map<number, L.DivIcon>()
    orders.forEach((o) => m.set(o.id, orderIcon(o.status)))
    return m
  }, [orders])

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
        {drivers.map((d) => (
          <Marker
            key={`d-${d.id}`}
            position={[d.lat, d.lng]}
            icon={driverIcons.get(d.id)}
          >
            <Popup>
              <strong>{d.name}</strong>
              <br />
              <span style={{ textTransform: 'capitalize' }}>{d.status}</span>
            </Popup>
          </Marker>
        ))}
        {orders.map((o) => {
          const pos = ORDER_POSITION[o.id]
          if (!pos) return null
          return (
            <Marker
              key={`o-${o.id}`}
              position={pos}
              icon={orderIcons.get(o.id)}
            >
              <Popup>
                <strong>{o.customer}</strong>
                <br />
                {o.restaurant}
                <br />
                <span style={{ textTransform: 'capitalize' }}>{o.status}</span>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}
