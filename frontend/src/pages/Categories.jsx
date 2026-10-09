
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Layers3,
  RefreshCw,
  Search,
  ShoppingBag,
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../services/api";
import getImageUrl from "../utils/getImageUrl.js";

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const filteredCategories = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    const filtered = categories.filter((category) => {
      if (!query) return true;

      const haystack = [
        category.name,
        category.description,
        category.slug,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });

    const sorted = [...filtered];

    switch (sortBy) {
      case "name-asc":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "newest":
        sorted.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
        break;
      case "featured":
      default:
        sorted.sort(
          (a, b) =>
            (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
            a.name.localeCompare(b.name)
        );
        break;
    }

    return sorted;
  }, [categories, searchTerm, sortBy]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(false);

      const response = await api.get("/categories");

      const categoryData =
        response.data?.data?.categories || [];

      const activeCategories = categoryData
        .filter((category) => category.isActive !== false)
        .sort(
          (a, b) =>
            (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
        );

      setCategories(activeCategories);
    } catch (err) {
      setError(true);
      toast.error(
        err.response?.data?.message ||
          "Unable to load categories."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-linear-to-br from-gray-950 via-gray-900 to-orange-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-orange-200">
              <Layers3 size={16} />
              Explore our collection
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Shop by{" "}
              <span className="text-orange-400">
                Categories
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-gray-300 sm:text-lg">
              Discover products across our collections.
              Explore different categories and find
              everything you need in one place.
            </p>

            <a
              href="#all-categories"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white transition hover:bg-orange-600"
            >
              Explore Categories
              <ArrowRight size={18} />
            </a>
          </div>

          <div className="mt-12 flex flex-wrap gap-8 border-t border-white/15 pt-8">
            <div>
              <p className="text-3xl font-bold">
                {loading ? "—" : categories.length}
              </p>
              <p className="mt-1 text-sm text-gray-400">
                Available Categories
              </p>
            </div>

            <div>
              <p className="text-3xl font-bold">
                <ShoppingBag size={28} />
              </p>
              <p className="mt-1 text-sm text-gray-400">
                Explore Products
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section
        id="all-categories"
        className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20"
      >
        <div className="mb-9 flex flex-col justify-between gap-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-orange-600">
                Find what you need
              </p>

              <h2 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">
                All Categories
              </h2>

              <p className="mt-3 text-gray-500">
                Browse our available product collections.
              </p>
            </div>

            {!loading && (
              <p className="text-sm text-gray-500">
                Showing{" "}
                <span className="font-semibold text-gray-900">
                  {filteredCategories.length}
                </span>{" "}
                categories
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <label className="relative block w-full md:max-w-md">
              <span className="sr-only">Search categories</span>
              <Search
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search categories..."
                className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-gray-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
            </label>

            <label className="flex items-center gap-3 text-sm text-gray-600">
              <span>Sort by</span>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              >
                <option value="featured">Featured</option>
                <option value="name-asc">Name: A-Z</option>
                <option value="name-desc">Name: Z-A</option>
                <option value="newest">Newest</option>
              </select>
            </label>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse overflow-hidden rounded-2xl border border-gray-200 bg-white"
              >
                <div className="aspect-4/3 bg-gray-200" />
                <div className="space-y-3 p-5">
                  <div className="h-5 w-2/3 rounded bg-gray-200" />
                  <div className="h-4 w-full rounded bg-gray-100" />
                  <div className="h-4 w-1/2 rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          /* Error State */
          <div className="rounded-2xl border border-red-100 bg-white px-6 py-16 text-center">
            <p className="text-lg font-semibold text-gray-900">
              Something went wrong
            </p>
            <p className="mt-2 text-sm text-gray-500">
              We couldn't load the categories.
              Please try again.
            </p>

            <button
              onClick={fetchCategories}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 font-semibold text-white hover:bg-orange-600"
            >
              <RefreshCw size={17} />
              Try Again
            </button>
          </div>
        ) : filteredCategories.length === 0 ? (
          /* Empty State */
          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center">
            <Layers3
              size={42}
              className="mx-auto text-gray-300"
            />

            <h3 className="mt-4 text-xl font-semibold text-gray-900">
              No matching categories found
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Try another search term or clear the current filters.
            </p>

            <button
              onClick={() => {
                setSearchTerm("");
                setSortBy("featured");
              }}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 font-semibold text-white hover:bg-orange-600"
            >
              Clear filters
            </button>
          </div>
        ) : (
          /* Category Cards */
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCategories.map((category, index) => (
              <article
                key={category._id}
                className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl"
              >
                <Link
                  to={`/shop?category=${encodeURIComponent(
                    category._id
                  )}`}
                  className="block"
                  aria-label={`Explore ${category.name} products`}
                >
                  {/* Category Image */}
                  <div className="relative aspect-4/3 overflow-hidden bg-gray-100">
                    {getImageUrl(category.image) ? (
                      <img
                        src={getImageUrl(category.image)}
                        alt={category.name}
                        loading={index < 4 ? "eager" : "lazy"}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                        onError={(event) => {
                          event.currentTarget.style.display =
                            "none";
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Layers3
                          size={52}
                          className="text-gray-300"
                        />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent" />

                    <div className="absolute bottom-4 left-4">
                      <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-gray-800">
                        Collection {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>

                    <div className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-900 opacity-0 shadow-lg transition group-hover:opacity-100">
                      <ArrowUpRight size={20} />
                    </div>
                  </div>

                  {/* Category Details */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-xl font-bold text-gray-900 transition group-hover:text-orange-600">
                        {category.name}
                      </h3>

                      <ArrowRight
                        size={20}
                        className="mt-1 shrink-0 text-gray-400 transition group-hover:translate-x-1 group-hover:text-orange-500"
                      />
                    </div>

                    <p className="mt-2 min-h-12 text-sm leading-6 text-gray-500">
                      {category.description ||
                        `Explore our ${category.name} collection and discover available products.`}
                    </p>

                    <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
                      <span className="text-xs text-gray-400">
                        {category.slug}
                      </span>

                      <span className="text-sm font-semibold text-orange-600">
                        Shop Now
                      </span>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-4 py-12 sm:px-6 md:flex-row lg:px-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Looking for something specific?
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Explore our complete product collection.
            </p>
          </div>

          <Link
            to="/shop"
            className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-3 font-semibold text-white transition hover:bg-orange-500"
          >
            View All Products
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </main>
  );
};

export default Categories;