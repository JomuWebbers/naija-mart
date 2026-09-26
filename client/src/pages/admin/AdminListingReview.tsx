import { useEffect, useState } from "react";
import { CheckIcon, XIcon } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/useAuth";
import { apiRequest } from "../../lib/api";

type PendingListing = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  originalPrice: number | null;
  image: string;
  images: string[];
  category: string;
  subcategory: string | null;
  stock: number | null;
  createdAt: string;
  seller: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
};

export default function AdminListingReview() {
  const { token } = useAuth();
  const [listings, setListings] = useState<PendingListing[] | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [approvingAll, setApprovingAll] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function fetchListings() {
      try {
        const data = await apiRequest("/products/pending", {
          token: token ?? undefined,
        });
        if (!ignore) {
          setListings(data);
        }
      } catch {
        if (!ignore) {
          toast.error("Failed to load pending listings");
          setListings([]);
        }
      }
    }

    fetchListings();

    return () => {
      ignore = true;
    };
  }, [token]);

  const review = async (id: string, status: "approved" | "rejected") => {
    setActingId(id);

    try {
      await apiRequest(`/products/${id}/review`, {
        method: "PATCH",
        token: token ?? undefined,
        body: { status },
      });

      setListings((current) =>
        current ? current.filter((listing) => listing.id !== id) : current,
      );

      toast.success(
        status === "approved" ? "Listing approved" : "Listing rejected",
      );
    } catch {
      toast.error("Could not update this listing");
    } finally {
      setActingId(null);
    }
  };

  const approveAll = async () => {
    // Check if listings is null before accessing .length
    if (!listings || listings.length === 0 || approvingAll || actingId !== null)
      return;

    setApprovingAll(true);

    try {
      const results = await Promise.allSettled(
        listings.map((listing) =>
          apiRequest(`/products/${listing.id}/review`, {
            method: "PATCH",
            token: token ?? undefined,
            body: { status: "approved" },
          }),
        ),
      );

      const failedIds = new Set(
        listings
          .filter((_, index) => results[index].status === "rejected")
          .map((listing) => listing.id),
      );

      setListings((current) =>
        current
          ? current.filter((listing) => failedIds.has(listing.id))
          : current,
      );

      const approvedCount = listings.length - failedIds.size;

      if (approvedCount > 0) {
        toast.success(
          `Approved ${approvedCount} listing${approvedCount === 1 ? "" : "s"}`,
        );
      }
      if (failedIds.size > 0) {
        toast.error(
          `${failedIds.size} listing${failedIds.size === 1 ? "" : "s"} could not be approved`,
        );
      }
    } finally {
      setApprovingAll(false);
    }
  };

  if (listings === null) {
    return <div className="p-10 text-center font-bold">Loading listings…</div>;
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-4 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">
            Listing Review
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Review seller submissions before they appear in the store.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
            {listings.length} pending
          </span>
          <button
            type="button"
            onClick={approveAll}
            disabled={
              listings.length === 0 || approvingAll || actingId !== null
            }
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {approvingAll ? "Approving…" : "Approve All"}
          </button>
        </div>
      </div>

      {listings.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center text-zinc-500">
          No listings are waiting for review.
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {listings.map((listing) => (
            <article
              key={listing.id}
              className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
            >
              <div className="grid sm:grid-cols-[180px_1fr]">
                <img
                  src={listing.image}
                  alt={listing.name}
                  className="h-48 w-full bg-zinc-100 object-cover sm:h-full"
                />

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                        {listing.category}
                        {listing.subcategory ? ` · ${listing.subcategory}` : ""}
                      </p>
                      <h2 className="mt-1 text-lg font-semibold text-zinc-900">
                        {listing.name}
                      </h2>
                    </div>
                    <span className="shrink-0 rounded-md bg-amber-100 px-2 py-1 text-[10px] font-semibold uppercase text-amber-800">
                      Pending
                    </span>
                  </div>

                  <p className="mt-2 line-clamp-3 text-sm text-zinc-600">
                    {listing.description || "No description provided."}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                    <span className="font-semibold text-zinc-900">
                      ₦{listing.price.toLocaleString()}
                    </span>
                    <span className="text-zinc-500">
                      Stock: {listing.stock ?? 0}
                    </span>
                    {listing.originalPrice ? (
                      <span className="text-zinc-500">
                        Original: ₦{listing.originalPrice.toLocaleString()}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-4 border-t border-zinc-100 pt-3 text-xs text-zinc-500">
                    <p>
                      Seller:{" "}
                      <span className="font-medium text-zinc-800">
                        {listing.seller.name}
                      </span>
                    </p>
                    <p>{listing.seller.email}</p>
                    <p>{listing.seller.phone || "No phone number on file"}</p>
                    <p className="mt-1">
                      Submitted{" "}
                      {new Date(listing.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => review(listing.id, "approved")}
                      disabled={actingId === listing.id || approvingAll}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 px-3 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      <CheckIcon className="size-4" />
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => review(listing.id, "rejected")}
                      disabled={actingId === listing.id || approvingAll}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                    >
                      <XIcon className="size-4" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
