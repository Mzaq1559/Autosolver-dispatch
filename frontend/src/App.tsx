import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import axios from 'axios'
import L from 'leaflet'

// Fix leaflet marker icon bug in React
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface Driver {
  id: number
  name: string
  lat: number
  lng: number
  status: string
}

function App() {
  const [drivers, setDrivers] = useState<Driver[]>([])

  useEffect(() => {
    axios.get('http://localhost:8000/drivers')
      .then(res => setDrivers(res.data))
  }, [])

  return (
    <div className="h-screen w-full">
      <MapContainer
        center={[31.5204, 74.3587]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {drivers.map(driver => (
          <Marker key={driver.id} position={[driver.lat, driver.lng]}>
            <Popup>
              🚴 {driver.name} — {driver.status}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}

export default App