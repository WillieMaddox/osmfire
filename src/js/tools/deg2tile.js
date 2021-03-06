/**
 * Created by maddoxw on 7/23/16.
 */


function toRad (x) {
  return x * Math.PI / 180.0
}

function toInt (x) {
  return ~~x
}

function mod (n, m) {
  return ((n % m) + m) % m
}

export default function (lon_deg, lat_deg, zoom) {
  const lat_rad = toRad(lat_deg)
  const n = Math.pow(2, zoom)
  const xtile = toInt(mod((lon_deg + 180.0) / 360.0, 1) * n)
  const ytile = toInt((1.0 - Math.log(Math.tan(lat_rad) + (1 / Math.cos(lat_rad))) / Math.PI) / 2.0 * n)
  const ztile = Math.round(zoom)
  return [xtile, ytile, ztile]
}
