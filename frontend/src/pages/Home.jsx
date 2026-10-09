import { ArrowRight, Check, Truck, ShieldCheck, Headphones } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import background from "../assets/background.png";

import api from "../services/api.js";
import ProductCard from "../components/product/ProductCard.jsx";
import SectionHeading from "../components/common/SectionHeading.jsx";
import getImageUrl from "../utils/getImageUrl.js";

const Home = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["home"],
    queryFn: async () => {
      const [categoryResponse, featuredResponse, newResponse] = await Promise.all([
        api.get("/categories"),
        api.get("/products?featured=true&limit=4"),
        api.get("/products?sort=newest&limit=4"),
      ]);

      return {
        categories: categoryResponse.data.data?.categories || [],
        featuredProducts: featuredResponse.data.data?.products || [],
        newProducts: newResponse.data.data?.products || [],
      };
    },
    staleTime: 5 * 60 * 1000,
    onError: (error) => {
      console.error("Homepage loading error:", error);
      toast.error("Unable to load homepage data.");
    },
  });

  const categories = data?.categories || [];
  const featuredProducts = data?.featuredProducts || [];
  const newProducts = data?.newProducts || [];

  const loadingCategories = isLoading;
  const loadingProducts = isLoading;

  return (
    <main>
      {/* HERO */}
      {/* <section className="bg-gray-50"> */}
        <section className="relative overflow-hidden bg-gray-950 text-white">
        <div className="mx-auto grid min-h-155 max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="mb-5 text-sm font-bold uppercase tracking-[0.25em] text-gray-500">
              New Collection 2026
            </p>

            <h1 className="max-w-2xl text-5xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
              Everything you need.
              <span className="block text-gray-500">
                All in one place.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-gray-300 sm:text-lg">
              Discover thoughtfully selected products designed to make
              everyday life better. Shop quality, style, and convenience
              from NOVA.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 rounded-xl bg-black px-7 py-4 font-semibold text-white transition hover:bg-red-800"
              >
                Shop Now
                <ArrowRight size={18} />
              </Link>

              <Link
                to="/categories"
                className="rounded-xl border border-gray-300 bg-white px-7 py-4 font-semibold text-gray-900 transition hover:bg-gray-100"
              >
                Explore Collection
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm text-gray-600">
              <span className="flex items-center gap-2">
                <Check size={17} />
                Secure checkout
              </span>

              <span className="flex items-center gap-2">
                <Check size={17} />
                Quality products
              </span>

              <span className="flex items-center gap-2">
                <Check size={17} />
                Easy returns
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="relative aspect-4/5 overflow-hidden rounded-4xl">
              <img
                src={background}
                alt="NOVA lifestyle collection"
                className="h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent" />

              <div className="absolute inset-x-0 bottom-0 p-8">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">
                  NOVA
                </p>

                <p className="mt-2 max-w-sm text-3xl font-bold text-white">
                  Designed for your everyday.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <SectionHeading
          eyebrow="Explore"
          title="Shop by Category"
          description="Find products that match your lifestyle and everyday needs."
          actionText="View all"
          actionHref="/categories"
        />

        {loadingCategories ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-48 animate-pulse rounded-2xl bg-gray-100"
              />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
            Categories will appear here once products are added.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {categories.slice(0, 4).map((category) => (
              <Link
                key={category._id}
                to={`/shop?category=${category._id}`}
                className="group relative overflow-hidden rounded-2xl bg-gray-100"
              >
                <div className="aspect-4/3">
                  {getImageUrl(category.image) ? (
                    <img
                      src={getImageUrl(category.image)}
                      alt={category.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gray-200">
                      <span className="text-xl font-bold text-gray-500">
                        {category.name}
                      </span>
                    </div>
                  )}
                </div>

                <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent p-5 pt-12">
                  <h3 className="font-bold text-white">
                    {category.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <SectionHeading
            eyebrow="Featured"
            title="Trending Right Now"
            description="Handpicked products customers are loving."
            actionText="Shop all products"
            actionHref="/shop"
          />

          {loadingProducts ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-107.5 animate-pulse rounded-2xl bg-white"
                />
              ))}
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
              Featured products will appear here once they are added from
              the admin panel.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* PROMO */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="overflow-hidden rounded-4xl bg-black px-8 py-14 text-white sm:px-14">
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
                Special Offer
              </p>

              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                Free shipping on orders over ₹999
              </h2>

              <p className="mt-3 max-w-xl text-gray-400">
                Shop your favourites and enjoy convenient delivery straight
                to your doorstep.
              </p>
            </div>

            <Link
              to="/shop"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-black transition hover:bg-gray-200"
            >
              Start Shopping
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* NEW ARRIVALS */}
      <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
        <SectionHeading
          eyebrow="Just In"
          title="New Arrivals"
          description="Fresh products added recently to the NOVA collection."
          actionText="See all"
          actionHref="/shop"
        />

        {loadingProducts ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-107.5 animate-pulse rounded-2xl bg-gray-100"
              />
            ))}
          </div>
        ) : newProducts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
            New products will appear here.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {newProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* BENEFITS */}
      <section className="border-y border-gray-200">
        <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-gray-200 px-6 py-6 sm:grid-cols-3 sm:divide-x sm:divide-y-0 lg:px-8">
          <div className="flex gap-4 px-5 py-6 sm:px-8">
            <Truck className="shrink-0" size={28} />

            <div>
              <h3 className="font-bold">Fast Delivery</h3>
              <p className="mt-1 text-sm text-gray-500">
                Reliable delivery right to your doorstep.
              </p>
            </div>
          </div>

          <div className="flex gap-4 px-5 py-6 sm:px-8">
            <ShieldCheck className="shrink-0" size={28} />

            <div>
              <h3 className="font-bold">Secure Payments</h3>
              <p className="mt-1 text-sm text-gray-500">
                Your payment information stays protected.
              </p>
            </div>
          </div>

          <div className="flex gap-4 px-5 py-6 sm:px-8">
            <Headphones className="shrink-0" size={28} />

            <div>
              <h3 className="font-bold">Customer Support</h3>
              <p className="mt-1 text-sm text-gray-500">
                We're here whenever you need help.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;