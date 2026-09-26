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
import { STATES, CITIES_BY_STATE } from "../data/nigeriaLocations";

const PAYMENT_METHODS = ["Card (Paystack)", "Bank Transfer", "Pay on Delivery"];

export default function Checkout() {
  const { items, subtotal, clearCart, removeFromCart } = useCart();
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
      // Re-fetch every cart item fresh from the backend before checkout,
      // rather than trusting whatever's been cached in localStorage.
      const freshResults = await Promise.all(
        items.map((item) =>
          apiRequest(`/products/${item.id}`)
            .then((product) => ({ item, product }))
            .catch(() => ({ item, product: null })),
        ),
      );

      const unavailable = freshResults.filter((r) => !r.product);
      if (unavailable.length > 0) {
        unavailable.forEach((r) => {
          removeFromCart(r.item.id);
          toast.error(
            `${r.item.name} is no longer available and was removed from your cart`,
          );
        });
        setPlacing(false);
        return;
      }

      const freshItems = freshResults.map((r) => ({
        productId: r.product.id,
        name: r.product.name,
        price: r.product.price, // always the live price, not a stale cached one
        qty: r.item.qty,
        sellerId: r.product.sellerId, // always present now, never missing
        payoutStatus: "pending",
      }));

      const freshSubtotal = freshItems.reduce(
        (sum, i) => sum + i.price * i.qty,
        0,
      );

      const order = await apiRequest("/orders", {
        method: "POST",
        token: token ?? undefined,
        body: {
          items: freshItems,
          shippingAddress: { name, phone, address, city, state },
          paymentMethod: payment,
          subtotal: freshSubtotal,
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
