import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import {
  MicroLabel,
  Divider,
  PageShell,
} from "../components/wireframe-primitives";
import { useAuth } from "../context/useAuth";
import { apiRequest } from "../lib/api";
import {
  ClipboardCheckIcon,
  PackageCheckIcon,
  TruckIcon,
  PartyPopperIcon,
  ClockIcon,
} from "lucide-react";

const STATUS_STEPS = [
  "Placed",
  "Confirmed",
  "Assigned",
  "Out for Delivery",
  "Delivered",
];

const STATUS_ICONS: Record<string, typeof ClockIcon> = {
  Placed: ClockIcon,
  Confirmed: ClipboardCheckIcon,
  Assigned: TruckIcon,
  "Out for Delivery": PackageCheckIcon,
  Delivered: PartyPopperIcon,
};

// LGA coordinate lookup — mirrors server/src/data/lgaCoordinates.ts, kept as a
// separate copy here since client and server are independent projects.
const LGA_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // Lagos
  Agege: { lat: 6.6155, lng: 3.3287 },
  "Ajeromi-Ifelodun": { lat: 6.459, lng: 3.3282 },
  Alimosho: { lat: 6.6103, lng: 3.2384 },
  "Amuwo-Odofin": { lat: 6.4467, lng: 3.2984 },
  Apapa: { lat: 6.4489, lng: 3.3595 },
  Badagry: { lat: 6.4155, lng: 2.8876 },
  Epe: { lat: 6.5832, lng: 3.985 },
  "Eti-Osa": { lat: 6.4402, lng: 3.47 },
  "Ibeju-Lekki": { lat: 6.4698, lng: 3.92 },
  "Ifako-Ijaiye": { lat: 6.6667, lng: 3.3 },
  Ikeja: { lat: 6.6018, lng: 3.3515 },
  Ikorodu: { lat: 6.6194, lng: 3.5105 },
  Kosofe: { lat: 6.5833, lng: 3.3833 },
  "Lagos Island": { lat: 6.4541, lng: 3.3947 },
  "Lagos Mainland": { lat: 6.5, lng: 3.3833 },
  Mushin: { lat: 6.5297, lng: 3.354 },
  Ojo: { lat: 6.4636, lng: 3.1808 },
  "Oshodi-Isolo": { lat: 6.53, lng: 3.32 },
  Shomolu: { lat: 6.54, lng: 3.38 },
  Surulere: { lat: 6.4924, lng: 3.354 },
  // Oyo
  Afijio: { lat: 7.7833, lng: 4.0333 },
  Akinyele: { lat: 7.5333, lng: 3.9333 },
  Atiba: { lat: 7.85, lng: 3.95 },
  Atisbo: { lat: 8.2, lng: 3.3667 },
  Egbeda: { lat: 7.3833, lng: 3.9833 },
  "Ibadan North": { lat: 7.4053, lng: 3.9089 },
  "Ibadan North-East": { lat: 7.4167, lng: 3.9333 },
  "Ibadan North-West": { lat: 7.3833, lng: 3.8833 },
  "Ibadan South-East": { lat: 7.3667, lng: 3.9167 },
  "Ibadan South-West": { lat: 7.35, lng: 3.8833 },
  "Ibarapa Central": { lat: 7.6167, lng: 3.15 },
  "Ibarapa East": { lat: 7.6667, lng: 3.3833 },
  "Ibarapa North": { lat: 7.7667, lng: 3.2 },
  Ido: { lat: 7.35, lng: 3.7 },
  Irepo: { lat: 8.6667, lng: 3.6667 },
  Iseyin: { lat: 7.9667, lng: 3.6 },
  Itesiwaju: { lat: 8.15, lng: 3.3167 },
  Iwajowa: { lat: 7.8, lng: 3.05 },
  Kajola: { lat: 8.05, lng: 3.0667 },
  Lagelu: { lat: 7.5, lng: 4.0333 },
  "Ogbomosho North": { lat: 8.1333, lng: 4.25 },
  "Ogbomosho South": { lat: 8.1, lng: 4.25 },
  "Ogo Oluwa": { lat: 8.0333, lng: 4.3167 },
  Olorunsogo: { lat: 8.3833, lng: 3.4167 },
  Oluyole: { lat: 7.3, lng: 3.85 },
  "Ona Ara": { lat: 7.2667, lng: 3.9667 },
  Orelope: { lat: 8.6333, lng: 3.4667 },
  "Ori Ire": { lat: 7.8333, lng: 4.1833 },
  "Oyo East": { lat: 7.85, lng: 3.9333 },
  "Oyo West": { lat: 7.85, lng: 3.8833 },
  "Saki East": { lat: 8.6667, lng: 3.4167 },
  "Saki West": { lat: 8.6667, lng: 3.3833 },
  "Surulere (Oyo State)": { lat: 8.5333, lng: 4.6667 },
  // Osun
  "Atakunmosa East": { lat: 7.5833, lng: 4.7667 },
  "Atakunmosa West": { lat: 7.5333, lng: 4.7167 },
  Aiyedaade: { lat: 7.45, lng: 4.3 },
  Aiyedire: { lat: 7.6833, lng: 4.3333 },
  Boluwaduro: { lat: 7.9667, lng: 4.6167 },
  Boripe: { lat: 7.7833, lng: 4.6167 },
  "Ede North": { lat: 7.7333, lng: 4.45 },
  "Ede South": { lat: 7.7167, lng: 4.4333 },
  Ejigbo: { lat: 7.9167, lng: 4.3167 },
  "Ife Central": { lat: 7.4667, lng: 4.5667 },
  "Ife East": { lat: 7.4833, lng: 4.5833 },
  "Ife North": { lat: 7.55, lng: 4.5333 },
  "Ife South": { lat: 7.35, lng: 4.5333 },
  Ifedayo: { lat: 7.85, lng: 4.75 },
  Ifelodun: { lat: 7.7, lng: 4.9333 },
  Ila: { lat: 8.0167, lng: 4.9 },
  "Ilesa East": { lat: 7.6167, lng: 4.7333 },
  "Ilesa West": { lat: 7.6167, lng: 4.7167 },
  Irepodun: { lat: 7.6167, lng: 4.85 },
  Irewole: { lat: 7.5333, lng: 4.1833 },
  Isokan: { lat: 7.55, lng: 4.3167 },
  Iwo: { lat: 7.6333, lng: 4.1833 },
  Obokun: { lat: 7.5333, lng: 4.8833 },
  "Odo Otin": { lat: 8.0833, lng: 4.5333 },
  "Ola Oluwa": { lat: 7.9, lng: 4.2833 },
  Olorunda: { lat: 7.7833, lng: 4.5667 },
  Oriade: { lat: 7.45, lng: 4.85 },
  Orolu: { lat: 7.85, lng: 4.4167 },
  Osogbo: { lat: 7.7719, lng: 4.5561 },
  // Ogun
  "Abeokuta North": { lat: 7.1667, lng: 3.35 },
  "Abeokuta South": { lat: 7.1475, lng: 3.3619 },
  "Ado-Odo/Ota": { lat: 6.6833, lng: 3.15 },
  "Egbado North": { lat: 7.2667, lng: 2.85 },
  "Egbado South": { lat: 6.9167, lng: 2.9167 },
  Ewekoro: { lat: 6.9667, lng: 3.2333 },
  Ifo: { lat: 6.8167, lng: 3.1833 },
  "Ijebu East": { lat: 6.85, lng: 4.0 },
  "Ijebu North": { lat: 6.95, lng: 3.9167 },
  "Ijebu North East": { lat: 6.9167, lng: 4.0333 },
  "Ijebu Ode": { lat: 6.8206, lng: 3.9181 },
  Ikenne: { lat: 6.8667, lng: 3.7167 },
  "Imeko Afon": { lat: 7.4167, lng: 2.8333 },
  Ipokia: { lat: 6.6667, lng: 2.9 },
  "Obafemi Owode": { lat: 7.0, lng: 3.4833 },
  Odeda: { lat: 7.2, lng: 3.4 },
  Odogbolu: { lat: 6.8333, lng: 3.8333 },
  "Ogun Waterside": { lat: 6.6167, lng: 4.15 },
  "Remo North": { lat: 6.9833, lng: 3.7333 },
  Shagamu: { lat: 6.848, lng: 3.644 },
};

type Order = {
  id: string;
  status: string;
  deliveryOtp: string | null;
  liveLocation: { lat: number; lng: number } | null;
  shippingAddress: {
    name: string;
    phone: string;
    address: string;
    city: string;
    state: string;
  };
  deliveryPartner: {
    name: string;
    vehicleType: string | null;
    phone: string;
  } | null;
  statusHistory: { status: string; at: string }[];
};

export default function OrderTracking() {
  const { id } = useParams();
  const { token } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [notFound, setNotFound] = useState(false);
  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    if (!id) return;

    let attempts = 0;
    const maxInitialRetries = 4;

    const fetchOrder = () => {
      apiRequest(`/orders/${id}`, { token: token ?? undefined })
        .then((data) => {
          setOrder(data);
          setNotFound(false);
          hasLoadedOnce.current = true;
          attempts = 0; // Reset attempts on successful fetch
        })
        .catch(() => {
          attempts++;
          if (!hasLoadedOnce.current && attempts >= maxInitialRetries) {
            setNotFound(true);
          }
          // otherwise: either we've already loaded once, or we've exceeded the max retries, so we don't change the state
        });
    };

    fetchOrder();
    const interval = setInterval(fetchOrder, 5000);
    return () => clearInterval(interval);
  }, [id, token]);

  if (notFound) {
    return (
      <div className="p-10 text-center">
        <p className="font-bold mb-4">Order not found.</p>
        <Link to="/" className="underline font-bold">
          Back to Home
        </Link>
      </div>
    );
  }

  if (!order) {
    return <div className="p-10 text-center font-bold">Loading order…</div>;
  }

  const currentStepIndex = STATUS_STEPS.indexOf(order.status);
  const otpDigits = order.deliveryOtp ? order.deliveryOtp.split("") : [];
  const destination = order.shippingAddress.city
    ? LGA_COORDINATES[order.shippingAddress.city]
    : undefined;

  return (
    <PageShell
      title="Track Order"
      breadcrumb={`Order #${order.id.slice(-8).toUpperCase()}`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ── Live map ──────────────────────────────────────────── */}
        <div className="lg:col-span-7">
          {order.liveLocation ? (
            <MapContainer
              center={[order.liveLocation.lat, order.liveLocation.lng]}
              zoom={11}
              scrollWheelZoom={false}
              className="h-72 md:h-[420px] w-full"
            >
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
                attribution="Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012"
              />
              <Marker
                position={[order.liveLocation.lat, order.liveLocation.lng]}
              >
                <Popup>Your delivery is currently here</Popup>
              </Marker>
              {destination && (
                <>
                  <Marker position={[destination.lat, destination.lng]}>
                    <Popup>Delivery destination</Popup>
                  </Marker>
                  <Polyline
                    positions={[
                      [order.liveLocation.lat, order.liveLocation.lng],
                      [destination.lat, destination.lng],
                    ]}
                    color="#E63312"
                    dashArray="6 6"
                  />
                </>
              )}
            </MapContainer>
          ) : (
            <div className="h-72 md:h-[420px] w-full bg-neutral-100 flex items-center justify-center">
              <MicroLabel>
                Tracking will appear once your order is out for delivery
              </MicroLabel>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 mt-3 border border-black/15 p-3">
            <MicroLabel>Delivery Partner</MicroLabel>
            {order.deliveryPartner ? (
              <>
                <span className="text-[13px] font-bold">
                  {order.deliveryPartner.name} —{" "}
                  {order.deliveryPartner.vehicleType || "Rider"}
                </span>

                <a
                  href={`tel:${order.deliveryPartner.phone}`}
                  className="text-[10px] uppercase font-bold underline"
                >
                  Call
                </a>
              </>
            ) : (
              <span className="text-[12px] text-neutral-400">
                Not yet assigned
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── OTP + address + ETA ──────────────────────────────────────── */}
      <div className="lg:col-span-5 space-y-6">
        <Divider />

        <div className="border-2 border-black p-4">
          <MicroLabel>Delivery Confirmation Code</MicroLabel>
          <p className="text-[11px] text-neutral-500 font-medium mt-2 leading-relaxed">
            Share this code with your delivery partner only when your order
            arrives, to confirm receipt.
          </p>
          <div className="flex gap-2 mt-4">
            {otpDigits.length > 0 ? (
              otpDigits.map((d, i) => (
                <div
                  key={i}
                  className="w-12 h-14 border-2 border-black flex items-center justify-center text-[20px] font-black"
                >
                  {d}
                </div>
              ))
            ) : (
              <p className="text-[13px] text-neutral-400">
                OTP will be generated once a delivery partner is assigned.
              </p>
            )}
          </div>
        </div>

        <Divider />

        <div>
          <MicroLabel>Delivering To</MicroLabel>
          <div className="border border-black/15 p-3 mt-2">
            <p className="text-[13px] font-bold">
              {order.shippingAddress.name}
            </p>
            <p className="text-[12px] text-neutral-600">
              {order.shippingAddress.phone}
            </p>
            <p className="text-[12px] text-neutral-600">
              {order.shippingAddress.address}, {order.shippingAddress.city},{" "}
              {order.shippingAddress.state}
            </p>
          </div>
        </div>

        <div>
          <MicroLabel>Estimated Arrival</MicroLabel>
          <p className="text-[16px] font-black mt-1">
            {order.status === "Delivered"
              ? "Delivered"
              : order.status === "Out for Delivery"
                ? "Same day delivery — your rider is on the way"
                : "Will be confirmed once your order is out for delivery"}
          </p>
        </div>
      </div>

      {/* ── Delivery Progress — rounded, icon-based, current-step highlighted ── */}
      <div className="mt-6">
        <MicroLabel>Delivery Progress</MicroLabel>
        <div className="mt-4 max-w-md">
          {STATUS_STEPS.map((step, i) => {
            const isComplete = i < currentStepIndex;
            const isCurrent = i === currentStepIndex;
            const isLast = i === STATUS_STEPS.length - 1;
            const Icon = STATUS_ICONS[step] || ClockIcon;

            return (
              <div key={step} className="flex gap-4">
                <div className="relative flex flex-col items-center">
                  {isCurrent && (
                    <span className="absolute top-0 size-10 rounded-full bg-indigo-400 opacity-75 animate-ping" />
                  )}
                  <div
                    className={`relative size-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                      isComplete || isCurrent
                        ? "bg-indigo-600 text-white"
                        : "bg-zinc-100 text-zinc-400"
                    }`}
                  >
                    <Icon className="size-5" />
                  </div>
                  {!isLast && (
                    <div
                      className={`w-0.5 flex-1 min-h-[36px] ${isComplete ? "bg-indigo-600" : "bg-zinc-200"}`}
                    />
                  )}
                </div>

                <div className="pb-8">
                  <p
                    className={`text-sm font-semibold ${isComplete || isCurrent ? "text-zinc-900" : "text-zinc-400"}`}
                  >
                    {step}
                  </p>
                  {order.statusHistory?.find((h) => h.status === step) && (
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {new Date(
                        order.statusHistory.find((h) => h.status === step)!.at,
                      ).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </PageShell>
  );
}
