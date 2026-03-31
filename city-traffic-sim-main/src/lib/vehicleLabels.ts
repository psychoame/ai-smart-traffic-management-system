import type { VehicleType } from "./trafficEngine";

function numericFromId(id: string): number {
  const n = Number(id.replace(/\D/g, ""));
  return Number.isFinite(n) ? n : 0;
}

// Deterministically formats an internal id like `v12` into a plate-like label:
// "TNXX XX 1234"
export function formatVehicleNumber(vehicleId: string): string {
  const n = numericFromId(vehicleId);
  const district = 18 + (n % 7); // TN18..TN24
  const series = ["G", "H", "J", "K", "L", "M"][n % 6];
  const plate = 1000 + ((n * 37 + 888) % 9000);
  return `TN${district} ${series} ${plate}`;
}

export function formatVehicleType(type: VehicleType): "Car" | "Ambulance" {
  return type === "ambulance" ? "Ambulance" : "Car";
}

