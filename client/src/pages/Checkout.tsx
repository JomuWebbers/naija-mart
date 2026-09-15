import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Wire,
  MicroLabel,
  Divider,
  PageShell,
} from "../components/wireframe-primitives";
import { fmt } from "../components/wireframe-helpers";
import { useCart } from "../context/useCart";
import { useAuth } from "../context/useAuth";
import { apiRequest } from "../lib/api";

const STATES = ['Osun', 'Ogun', 'Lagos', 'Oyo']
const CITIES_BY_STATE: Record<string, string[]> = {
  Lagos: [
    "Agege",
    "Ajeromi-Ifelodun",
    "Alimosho",
    "Amuwo-Odofin",
    "Apapa",
    "Badagry",
    "Epe",
    "Eti-Osa",
    "Ibeju-Lekki",
    "Ifako-Ijaiye",
    "Ikeja",
    "Ikorodu",
    "Kosofe",
    "Lagos Island",
    "Lagos Mainland",
    "Mushin",
    "Ojo",
    "Oshodi-Isolo",
    "Shomolu",
    "Surulere",
  ],
  Oyo: [
    "Afijio",
    "Akinyele",
    "Atiba",
    "Atisbo",
    "Egbeda",
    "Ibadan North",
    "Ibadan North-East",
    "Ibadan North-West",
    "Ibadan South-East",
    "Ibadan South-West",
    "Ibarapa Central",
    "Ibarapa East",
    "Ibarapa North",
    "Ido",
    "Irepo",
    "Iseyin",
    "Itesiwaju",
    "Iwajowa",
    "Kajola",
    "Lagelu",
    "Ogbomosho North",
    "Ogbomosho South",
    "Ogo Oluwa",
    "Olorunsogo",
    "Oluyole",
    "Ona Ara",
    "Orelope",
    "Ori Ire",
    "Oyo East",
    "Oyo West",
    "Saki East",
    "Saki West",
    "Surulere (Oyo State)",
  ],
  Osun: [
    "Atakunmosa East",
    "Atakunmosa West",
    "Aiyedaade",
    "Aiyedire",
    "Boluwaduro",
    "Boripe",
    "Ede North",
    "Ede South",
    "Ejigbo",
    "Ife Central",
    "Ife East",
    "Ife North",
    "Ife South",
    "Ifedayo",
    "Ifelodun",
    "Ila",
    "Ilesa East",
    "Ilesa West",
    "Irepodun",
    "Irewole",
    "Isokan",
    "Iwo",
    "Obokun",
    "Odo Otin",
    "Ola Oluwa",
    "Olorunda",
    "Oriade",
    "Orolu",
    "Osogbo",
  ],
   Ogun: [
    'Abeokuta North', 'Abeokuta South', 'Ado-Odo/Ota', 'Egbado North', 'Egbado South',
    'Ewekoro', 'Ifo', 'Ijebu East', 'Ijebu North', 'Ijebu North East', 'Ijebu Ode',
    'Ikenne', 'Imeko Afon', 'Ipokia', 'Obafemi Owode', 'Odeda', 'Odogbolu',
    'Ogun Waterside', 'Remo North', 'Shagamu',
  ],
};

const PAYMENT_METHODS = ["Card (Paystack)", "Bank Transfer", "Pay on Delivery"];

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState(STATES[0]);
  const [payment, setPayment] = useState(PAYMENT_METHODS[0]);
  const [placing, setPlacing] = useState(false);

  const deliveryFee = 3_500;
  const total = subtotal + deliveryFee;

  if (items.length === 0) {
    return (
      <div className="p-10 text-center">
        <p className="font-bold mb-4">
          Your cart is empty — nothing to check out.
        </p>
      </div>
    );
  }

  const handlePlaceOrder = async (e: FormEvent) => {
    e.preventDefault();

    if (!name || !phone || !address || !city) {
      toast.error("Please fill in all delivery details");
      return;
    }

    setPlacing(true);

    try {
      const order = await apiRequest("/orders", {
        method: "POST",
        token: token ?? undefined,
        body: {
          items: items.map((i) => ({
            productId: i.id,
            name: i.name,
            price: i.price,
            qty: i.qty,
          })),
          shippingAddress: { name, phone, address, city, state },
          paymentMethod: payment,
          subtotal,
          deliveryFee,
        },
      });

      clearCart();
      toast.success("Order placed!");
      navigate(`/orders/${order.id}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to place order";
      toast.error(message);
    } finally {
      setPlacing(false);
    }
  };

  return (
    <PageShell title="Checkout" breadcrumb="Cart / Delivery / Payment / Review">
      {/* Responsive: form stacks full width on mobile, order summary sits beside it from lg up */}
      <form onSubmit={handlePlaceOrder}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            {/* ── Delivery address ──────────────────────────────────── */}
            <section>
              <MicroLabel>1. Delivery Address</MicroLabel>
              <div className="border-2 border-black p-4 mt-3 space-y-3">
                <input
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-black/20 p-3 text-[13px] outline-none"
                />
                <input
                  placeholder="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-black/20 p-3 text-[13px] outline-none"
                />
                <input
                  placeholder="Street Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full border border-black/20 p-3 text-[13px] outline-none"
                />

                {/* Responsive: two columns from sm up, stacked on mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                    className="w-full border border-black/20 p-3 text-[13px] outline-none"
                  >
                    <option value="" disabled>
                      Select LGA
                    </option>
                    {CITIES_BY_STATE[state]?.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                  
                  <select
                    value={state}
                    onChange={(e) => {
                      setState(e.target.value);
                      setCity(""); // reset city so an old LGA from a different state can't linger
                    }}
                    className="w-full border border-black/20 p-3 text-[13px] outline-none"
                  >
                    {STATES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <MicroLabel>
                  Delivery tracking is available in Osun, Lagos, and Oyo states
                </MicroLabel>
              </div>
            </section>

            {/* ── Payment method ────────────────────────────────────── */}
            <section>
              <MicroLabel>2. Payment Method</MicroLabel>
              <div className="mt-3 space-y-2">
                {PAYMENT_METHODS.map((m) => (
                  <label
                    key={m}
                    className={`flex items-center gap-3 border-2 p-4 cursor-pointer ${
                      payment === m ? "border-black" : "border-black/15"
                    }`}
                  >
                    <input
                      type="radio"
                      checked={payment === m}
                      onChange={() => setPayment(m)}
                      className="accent-black"
                    />
                    <span className="text-[13px] font-semibold">{m}</span>
                  </label>
                ))}
              </div>
            </section>

            {/* ── Order items review ────────────────────────────────── */}
            <section>
              <MicroLabel>3. Review Items</MicroLabel>
              <div className="space-y-3 mt-3">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 border border-black/15 p-3"
                  >
                    <Wire h="h-16 w-16" />
                    <div className="flex-1">
                      <MicroLabel>ITEM {i}</MicroLabel>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* ── Order total + place order ──────────────────────────── */}
          <div className="lg:col-span-4">
            <div className="border-2 border-black p-5 sticky top-4">
              <MicroLabel>Order Total</MicroLabel>
              <div className="mt-4 space-y-3 text-[13px] font-semibold">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Subtotal</span>
                  <span>{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Delivery Fee</span>
                  <span>{fmt(deliveryFee)}</span>
                </div>
              </div>
              <Divider thick />
              <div className="flex justify-between text-[16px] font-black mt-3">
                <span>Total</span>
                <span>{fmt(total)}</span>
              </div>
              <button
                type="submit"
                disabled={placing}
                style={{ backgroundColor: "var(--vermilion)" }}
                className="w-full py-4 mt-5 text-white text-[11px] tracking-[0.2em] uppercase font-black disabled:opacity-60"
              >
                {placing ? "Placing Order…" : "Place Order"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </PageShell>
  );
}
