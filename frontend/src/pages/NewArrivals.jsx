
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, Search } from "lucide-react";
import toast from "react-hot-toast";

import api from "../services/api.js";
import ProductCard from "../components/product/ProductCard.jsx";

const NewArrivals = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
  });

  const limit = 12;

  useEffect(() => {
    fetchNewArrivals();
  }, [page]);

  const fetchNewArrivals = async () => {
    try {
      setLoading(true);

      const response = await api.get("/products", {
        params: {
          sort: "newest",
          page,
          limit,
        },
      });

      const data = response.data?.data;

      setProducts(data?.products || []);
      setPagination({
        total: data?.pagination?.total || 0,
        totalPages: data?.pagination?.totalPages || 1,
      });
    } catch (error) {
      console.error("New arrivals loading error:", error);
      toast.error("Unable to load new arrivals.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
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
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gray-950 text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -right-20 -top-32 h-96 w-96 rounded-full bg-gray-500 blur-3xl" />
          <div className="absolute -bottom-40 left-10 h-96 w-96 rounded-full bg-gray-700 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-gray-200">
              <Sparkles size={16} />
              Freshly Added to NOVA
            </div>

            <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              New Arrivals
              <span className="block text-gray-400">
                Discover What's New.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-gray-300 sm:text-lg">
              Explore our latest collection of products. Discover fresh
              styles, new essentials, and recently added favourites.
            </p>

            <Link
              to="/shop"
              className="mt-9 inline-flex items-center gap-3 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-gray-950 transition hover:bg-gray-200"
            >
              Explore All Products
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8 lg:py-20">
        <div className="mb-9 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
              Just Arrived
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-tight text-gray-950">
              Latest Products
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Be the first to explore our newest additions.
            </p>
          </div>

          {!loading && (
            <p className="text-sm font-medium text-gray-500">
              {pagination.total} products available
            </p>
          )}
        </div>

        {/* Loading Skeleton */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <div
                key={item}
                className="overflow-hidden rounded-2xl border border-gray-100"
              >
                <div className="aspect-square animate-pulse bg-gray-100" />

                <div className="space-y-3 p-4">
                  <div className="h-3 w-20 animate-pulse rounded bg-gray-100" />
                  <div className="h-5 w-3/4 animate-pulse rounded bg-gray-100" />
                  <div className="h-5 w-24 animate-pulse rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          /* Empty State */
          <div className="rounded-2xl border border-dashed border-gray-300 px-6 py-20 text-center">
            <Search
              size={42}
              className="mx-auto text-gray-400"
            />

            <h3 className="mt-5 text-xl font-bold text-gray-900">
              No new arrivals yet
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
              New products will appear here as soon as they are added
              to our collection.
            </p>

            <Link
              to="/shop"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800"
            >
              Browse All Products
              <ArrowRight size={17} />
            </Link>
          </div>
        ) : (
          <>
            {/* Product Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard
                  key={product._id ?? product.id}
                  product={product}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-14 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => goToPage(page - 1)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                {Array.from(
                  { length: pagination.totalPages },
                  (_, index) => index + 1
                ).map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => goToPage(pageNumber)}
                    className={`h-10 w-10 rounded-lg text-sm font-semibold transition ${
                      page === pageNumber
                        ? "bg-black text-white"
                        : "border border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    {pageNumber}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={page === pagination.totalPages}
                  onClick={() => goToPage(page + 1)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 py-12 text-center sm:flex-row sm:text-left lg:px-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-950">
              Explore the complete collection
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Find more products across all our categories.
            </p>
          </div>

          <Link
            to="/shop"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-black px-6 py-3 font-semibold text-white transition hover:bg-gray-800"
          >
            Shop Now
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </main>
  );
};

export default NewArrivals;