import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";

import api from "../services/api.js";
import ProductCard from "../components/product/ProductCard.jsx";

const defaultPagination = {
  total: 0,
  page: 1,
  limit: 12,
  totalPages: 1,
};

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(
    searchParams.get("category") || ""
  );
  const [brand, setBrand] = useState(searchParams.get("brand") || "");
  const [minPrice, setMinPrice] = useState(
    searchParams.get("minPrice") || ""
  );
  const [maxPrice, setMaxPrice] = useState(
    searchParams.get("maxPrice") || ""
  );
  const [sort, setSort] = useState(
    searchParams.get("sort") || "newest"
  );

  const [page, setPage] = useState(
    Number(searchParams.get("page")) || 1
  );

  const productQueryParams = useMemo(() => {
    const params = new URLSearchParams();

    if (search.trim()) params.set("search", search.trim());
    if (category) params.set("category", category);
    if (brand.trim()) params.set("brand", brand.trim());
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (sort) params.set("sort", sort);

    params.set("page", String(page));
    params.set("limit", "12");

    return {
      queryString: params.toString(),
      page,
      search: search.trim(),
      category,
      brand: brand.trim(),
      minPrice,
      maxPrice,
      sort,
    };
  }, [search, category, brand, minPrice, maxPrice, sort, page]);

  const { data: categoriesData = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await api.get("/categories");
      return response.data.data?.categories || [];
    },
    staleTime: 5 * 60 * 1000,
    onError: (error) => {
      console.error("Category loading error:", error);
    },
  });

  const { data: productData, isLoading: loading } = useQuery({
    queryKey: ["products", productQueryParams],
    queryFn: async () => {
      const response = await api.get(`/products?${productQueryParams.queryString}`);
      return response.data.data || {
        products: [],
        pagination: defaultPagination,
      };
    },
    onError: (error) => {
      console.error("Product loading error:", error);
      toast.error("Unable to load products.");
    },
  });

  const categories = Array.isArray(categoriesData) ? categoriesData : [];
  const products = productData?.products || [];
  const pagination = productData?.pagination || defaultPagination;

  const updateURL = (key, value) => {
    const params = new URLSearchParams(searchParams);

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    params.set("page", "1");

    setSearchParams(params);
    setPage(1);
  };

  const handleSearch = (event) => {
    event.preventDefault();
    updateURL("search", search);
  };

  const handleCategoryChange = (value) => {
    setCategory(value);
    updateURL("category", value);
  };

  const handleSortChange = (value) => {
    setSort(value);
    updateURL("sort", value);
  };

  const handleApplyPrice = () => {
    const params = new URLSearchParams(searchParams);

    if (minPrice) {
      params.set("minPrice", minPrice);
    } else {
      params.delete("minPrice");
    }

    if (maxPrice) {
      params.set("maxPrice", maxPrice);
    } else {
      params.delete("maxPrice");
    }

    params.set("page", "1");

    setSearchParams(params);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setCategory("");
    setBrand("");
    setMinPrice("");
    setMaxPrice("");
    setSort("newest");
    setPage(1);
    setSearchParams({});
  };

  const goToPage = (newPage) => {
    setPage(newPage);

    const params = new URLSearchParams(searchParams);
    params.set("page", newPage);

    setSearchParams(params);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const hasFilters =
    search ||
    category ||
    brand ||
    minPrice ||
    maxPrice ||
    sort !== "newest";

  return (
    <main className="min-h-screen bg-white">
      {/* Page Header */}
      {/* <section className="border-b border-gray-200 bg-gray-50"> */}
      <section className="relative overflow-hidden bg-gray-950 text-white">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
            NOVA Store
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
            Shop All Products
          </h1>

          <p className="mt-6 max-w-xl text-base leading-7 text-gray-300 sm:text-lg">
            Explore our collection of carefully selected products for
            everyday life.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        {/* Mobile Filter Button */}
        <div className="mb-6 flex items-center justify-between lg:hidden">
          <span className="text-sm font-medium text-gray-600">
            {pagination.total} products
          </span>

          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold"
          >
            <SlidersHorizontal size={17} />
            Filters
          </button>
        </div>

        <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
          {/* Desktop Filters */}
          <aside className="hidden lg:block">
            <FilterPanel
              search={search}
              setSearch={setSearch}
              handleSearch={handleSearch}
              categories={categories}
              category={category}
              handleCategoryChange={handleCategoryChange}
              brand={brand}
              setBrand={setBrand}
              minPrice={minPrice}
              setMinPrice={setMinPrice}
              maxPrice={maxPrice}
              setMaxPrice={setMaxPrice}
              handleApplyPrice={handleApplyPrice}
              clearFilters={clearFilters}
              hasFilters={hasFilters}
            />
          </aside>

          {/* Products */}
          <section>
            {/* Toolbar */}
            <div className="mb-7 hidden items-center justify-between border-b border-gray-200 pb-5 lg:flex">
              <p className="text-sm text-gray-500">
                Showing{" "}
                <span className="font-semibold text-gray-900">
                  {products.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-900">
                  {pagination.total}
                </span>{" "}
                products
              </p>

              <div className="flex items-center gap-3">
                <label
                  htmlFor="sort"
                  className="text-sm text-gray-500"
                >
                  Sort by
                </label>

                <select
                  id="sort"
                  value={sort}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium outline-none focus:border-black"
                >
                  <option value="newest">Newest</option>
                  <option value="price-low">
                    Price: Low to High
                  </option>
                  <option value="price-high">
                    Price: High to Low
                  </option>
                  <option value="rating">Top Rated</option>
                  <option value="name">Name</option>
                </select>
              </div>
            </div>

            {/* Mobile Sort */}
            <div className="mb-6 flex items-center justify-between lg:hidden">
              <span className="text-sm text-gray-500">
                Sort products
              </span>

              <select
                value={sort}
                onChange={(e) => handleSortChange(e.target.value)}
                className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none"
              >
                <option value="newest">Newest</option>
                <option value="price-low">
                  Price: Low to High
                </option>
                <option value="price-high">
                  Price: High to Low
                </option>
                <option value="rating">Top Rated</option>
                <option value="name">Name</option>
              </select>
            </div>

            {/* Product Grid */}
            {loading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((item) => (
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
              <div className="rounded-2xl border border-dashed border-gray-300 px-6 py-20 text-center">
                <Search
                  size={42}
                  className="mx-auto text-gray-400"
                />

                <h2 className="mt-5 text-xl font-bold text-gray-900">
                  No products found
                </h2>

                <p className="mx-auto mt-2 max-w-md text-gray-500">
                  Try changing your search or filters to find what
                  you're looking for.
                </p>

                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-6 rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="mt-12 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      disabled={page === 1}
                      onClick={() => goToPage(page - 1)}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
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
                        className={`h-10 w-10 rounded-lg text-sm font-semibold ${
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
                      disabled={
                        page === pagination.totalPages
                      }
                      onClick={() => goToPage(page + 1)}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileFiltersOpen(false)}
          />

          <div className="absolute right-0 top-0 h-full w-[85%] max-w-sm overflow-y-auto bg-white p-6 shadow-2xl">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-xl font-bold">Filters</h2>

              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="rounded-full p-2 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <FilterPanel
              search={search}
              setSearch={setSearch}
              handleSearch={handleSearch}
              categories={categories}
              category={category}
              handleCategoryChange={handleCategoryChange}
              brand={brand}
              setBrand={setBrand}
              minPrice={minPrice}
              setMinPrice={setMinPrice}
              maxPrice={maxPrice}
              setMaxPrice={setMaxPrice}
              handleApplyPrice={handleApplyPrice}
              clearFilters={clearFilters}
              hasFilters={hasFilters}
            />

            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              className="mt-8 w-full rounded-xl bg-black py-3 font-semibold text-white"
            >
              View Products
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

const FilterPanel = ({
  search,
  setSearch,
  handleSearch,
  categories,
  category,
  handleCategoryChange,
  brand,
  setBrand,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  handleApplyPrice,
  clearFilters,
  hasFilters,
}) => {
  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-lg font-bold">Filters</h2>

        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs font-semibold text-gray-500 underline"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-8">
        <label className="mb-2 block text-sm font-semibold">
          Search
        </label>

        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-3 text-sm outline-none focus:border-black"
          />
        </div>
      </form>

      {/* Category */}
      <div className="mb-8">
        <h3 className="mb-3 text-sm font-semibold">Category</h3>

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => handleCategoryChange("")}
            className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${
              category === ""
                ? "bg-black font-semibold text-white"
                : "hover:bg-gray-100"
            }`}
          >
            All Categories
          </button>

          {categories.map((item) => (
            <button
              key={item._id}
              type="button"
              onClick={() => handleCategoryChange(item._id)}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${
                category === item._id
                  ? "bg-black font-semibold text-white"
                  : "hover:bg-gray-100"
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>

      {/* Brand */}
      <div className="mb-8">
        <h3 className="mb-3 text-sm font-semibold">Brand</h3>

        <input
          type="text"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              updateBrandFromInput(e.target.value);
            }
          }}
          placeholder="Enter brand"
          className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm outline-none focus:border-black"
        />

        <button
          type="button"
          onClick={() => updateBrandFromInput(brand)}
          className="mt-2 text-xs font-semibold underline"
        >
          Apply brand
        </button>
      </div>

      {/* Price */}
      <div className="mb-8">
        <h3 className="mb-3 text-sm font-semibold">Price Range</h3>

        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min="0"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="Min ₹"
            className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm outline-none focus:border-black"
          />

          <input
            type="number"
            min="0"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Max ₹"
            className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm outline-none focus:border-black"
          />
        </div>

        <button
          type="button"
          onClick={handleApplyPrice}
          className="mt-3 w-full rounded-xl bg-black py-3 text-sm font-semibold text-white hover:bg-gray-800"
        >
          Apply Price
        </button>
      </div>
    </div>
  );

  function updateBrandFromInput(value) {
    const params = new URLSearchParams(searchParams);

    if (value.trim()) {
      params.set("brand", value.trim());
    } else {
      params.delete("brand");
    }

    params.set("page", "1");

    setSearchParams(params);
  }
};

export default Shop;
