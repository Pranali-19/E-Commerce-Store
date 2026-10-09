
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Tag,
  Copy,
  Check,
  Search,
  Sparkles,
  ArrowRight,
  TicketPercent,
} from "lucide-react";
import toast from "react-hot-toast";

import api from "../services/api.js";
import ProductCard from "../components/product/ProductCard.jsx";

const Offers = () => {
  const [coupons, setCoupons] = useState([]);
  const [products, setProducts] = useState([]);

  const [couponSearch, setCouponSearch] = useState("");
  const [loadingCoupons, setLoadingCoupons] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [copiedCode, setCopiedCode] = useState("");

  const limit = 12;

  useEffect(() => {
    fetchCoupons();
  }, []);

  useEffect(() => {
    fetchDiscountedProducts();
  }, [page]);

  const fetchCoupons = async () => {
    try {
      setLoadingCoupons(true);

      const response = await api.get("/coupons/available");

      setCoupons(response.data?.data?.coupons || []);
    } catch (error) {
      console.error("Coupon loading error:", error);
      toast.error("Unable to load available offers.");
      setCoupons([]);
    } finally {
      setLoadingCoupons(false);
    }
  };

  const fetchDiscountedProducts = async () => {
    try {
      setLoadingProducts(true);

      const response = await api.get("/products", {
        params: {
          onSale: "true",
          sort: "newest",
          page,
          limit,
        },
      });

      const data = response.data?.data;

      setProducts(data?.products || []);
      setTotalPages(data?.pagination?.totalPages || 1);
    } catch (error) {
      console.error("Discounted products loading error:", error);
      toast.error("Unable to load discounted products.");
      setProducts([]);
      setTotalPages(1);
    } finally {
      setLoadingProducts(false);
    }
  };

  const copyCoupon = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast.success("Coupon code copied!");

      setTimeout(() => {
        setCopiedCode("");
      }, 2000);
    } catch {
      toast.error("Unable to copy coupon code.");
    }
  };

  const filteredCoupons = coupons.filter((coupon) => {
    const search = couponSearch.trim().toLowerCase();

    return (
      coupon.code?.toLowerCase().includes(search) ||
      coupon.description?.toLowerCase().includes(search)
    );
  });

  const formatDiscount = (coupon) => {
    if (coupon.discountType === "percentage") {
      return `${coupon.discountValue}% OFF`;
    }

    return `₹${Number(coupon.discountValue).toLocaleString("en-IN")} OFF`;
  };

  const formatDate = (date) => {
    if (!date) return "No date available";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const goToPage = (newPage) => {
    setPage(newPage);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gray-950 text-white">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-gray-600/30 blur-3xl" />
        <div className="absolute -bottom-32 left-10 h-80 w-80 rounded-full bg-gray-700/30 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm text-gray-200">
              <Sparkles size={16} />
              NOVA Special Offers
            </div>

            <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Deals You'll Love.
              <span className="mt-2 block text-gray-400">
                Savings You'll Enjoy.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-gray-300 sm:text-lg">
              Explore available coupon codes and discounted products.
              Find an offer that works for your next purchase.
            </p>

            <a
              href="#available-coupons"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-gray-950 transition hover:bg-gray-200"
            >
              Explore Offers
              <ArrowRight size={18} />
            </a>
          </div>
        </div>
      </section>

      {/* Coupon Offers */}
      <section
        id="available-coupons"
        className="mx-auto max-w-7xl px-6 py-16 lg:px-8"
      >
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
              Save More
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-tight text-gray-950">
              Available Coupons
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Copy a coupon and apply it during checkout.
            </p>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={couponSearch}
              onChange={(e) => setCouponSearch(e.target.value)}
              placeholder="Search coupon offers..."
              className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-4 text-sm outline-none focus:border-black"
            />
          </div>
        </div>

        {loadingCoupons ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-56 animate-pulse rounded-2xl bg-gray-100"
              />
            ))}
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 px-6 py-16 text-center">
            <TicketPercent
              size={40}
              className="mx-auto text-gray-400"
            />

            <h3 className="mt-4 text-lg font-bold text-gray-900">
              No coupon offers found
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              {couponSearch
                ? "Try a different search term."
                : "Please check back later for new coupon offers."}
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredCoupons.map((coupon) => (
              <article
                key={coupon._id || coupon.code}
                className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex min-h-36 items-center justify-between gap-4 bg-gray-950 p-6 text-white">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                      Special Discount
                    </p>

                    <h3 className="mt-2 text-3xl font-black">
                      {formatDiscount(coupon)}
                    </h3>
                  </div>

                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10">
                    <Tag size={26} />
                  </div>
                </div>

                <div className="p-6">
                  <p className="min-h-10 text-sm leading-6 text-gray-600">
                    {coupon.description || "Special offer from NOVA."}
                  </p>

                  <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs text-gray-500">
                          Coupon Code
                        </p>
                        <p className="mt-1 font-black tracking-widest text-gray-950">
                          {coupon.code}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => copyCoupon(coupon.code)}
                        className="inline-flex items-center gap-2 rounded-lg bg-black px-3 py-2 text-xs font-semibold text-white transition hover:bg-gray-800"
                      >
                        {copiedCode === coupon.code ? (
                          <>
                            <Check size={15} />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy size={15} />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-xs text-gray-500">
                    <div className="flex justify-between gap-3">
                      <span>Minimum order</span>
                      <span className="font-semibold text-gray-800">
                        ₹
                        {Number(
                          coupon.minimumOrderAmount || 0
                        ).toLocaleString("en-IN")}
                      </span>
                    </div>

                    {coupon.maximumDiscount !== null &&
                      coupon.maximumDiscount !== undefined && (
                        <div className="flex justify-between gap-3">
                          <span>Maximum discount</span>
                          <span className="font-semibold text-gray-800">
                            ₹
                            {Number(
                              coupon.maximumDiscount
                            ).toLocaleString("en-IN")}
                          </span>
                        </div>
                      )}

                    <div className="flex justify-between gap-3">
                      <span>Valid until</span>
                      <span className="font-semibold text-gray-800">
                        {formatDate(coupon.expiryDate)}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Discounted Products */}
      <section className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="mb-9 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
                Limited Deals
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-tight text-gray-950">
                Discounted Products
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Shop products with an actual reduced price.
              </p>
            </div>

            <Link
              to="/shop"
              className="inline-flex items-center gap-2 text-sm font-bold text-gray-900 hover:text-gray-500"
            >
              Browse All Products
              <ArrowRight size={17} />
            </Link>
          </div>

          {loadingProducts ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                <div
                  key={item}
                  className="aspect-3/4 animate-pulse rounded-2xl bg-gray-200"
                />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
              <Tag
                size={40}
                className="mx-auto text-gray-400"
              />

              <h3 className="mt-4 text-lg font-bold text-gray-900">
                No discounted products available
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Check back soon for new product deals.
              </p>

              <Link
                to="/shop"
                className="mt-6 inline-flex rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800"
              >
                Explore Products
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => {
                  // ProductCard expects image URLs, while the API
                  // returns image objects containing a url.
                  const normalizedProduct = {
                    ...product,
                    images: (product.images || [])
                      .map((image) =>
                        typeof image === "string"
                          ? image
                          : image?.url
                      )
                      .filter(Boolean),
                  };

                  return (
                    <ProductCard
                      key={product.id || product._id}
                      product={normalizedProduct}
                    />
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    disabled={page === 1}
                    onClick={() => goToPage(page - 1)}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium disabled:opacity-40"
                  >
                    Previous
                  </button>

                  {Array.from(
                    { length: totalPages },
                    (_, index) => index + 1
                  ).map((pageNumber) => (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => goToPage(pageNumber)}
                      className={`h-10 w-10 rounded-lg text-sm font-semibold ${
                        page === pageNumber
                          ? "bg-black text-white"
                          : "border border-gray-300 bg-white hover:bg-gray-100"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  ))}

                  <button
                    type="button"
                    disabled={page === totalPages}
                    onClick={() => goToPage(page + 1)}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-6 py-14 text-center sm:flex-row sm:text-left lg:px-8">
          <div>
            <h2 className="text-2xl font-black text-gray-950">
              Found something you like?
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Explore the complete NOVA collection.
            </p>
          </div>

          <Link
            to="/shop"
            className="inline-flex items-center gap-2 rounded-xl bg-black px-6 py-3 font-semibold text-white hover:bg-gray-800"
          >
            Start Shopping
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </main>
  );
};

export default Offers;