
import React from "react";
import {
  AtSign,
  Globe,
  MessageCircle,
  Play,
} from "lucide-react";
import { Link} from "react-router-dom";
import { SocialIcon } from 'react-social-icons';


const Footer = () => {
  return (
    <footer className="mt-20 bg-black text-white">

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">

          {/* Brand */}
          <div>
            <h2 className="text-2xl font-black">
              NOVA
            </h2>

            <p className="mt-4 max-w-xs text-sm leading-6 text-gray-400">
              Discover products designed for
              modern living. Quality, style and
              convenience in one place.
            </p>

            <div className="mt-6 flex gap-2">
              <SocialIcon url="https://instagram.com" target="_blank" />
              <SocialIcon url="https://facebook.com" target="_blank" />
              <SocialIcon url="https://twitter.com" target="_blank" />
              <SocialIcon url="https://youtube.com" target="_blank" />
              
            </div>
          </div>

          {/* Shop */}
          <div>
            <h3 className="font-semibold">
              Shop
            </h3>

            <div className="mt-2 space-y-3 text-sm text-gray-400">
              <Link to="/shop">
                <p>All Products</p>
              </Link>
              <Link to="/new-arrivals">
                <p>New Arrivals</p>
              </Link>
              <Link to="/">
                <p>Best Sellers</p>
              </Link>
              <Link to="/offers">
                <p>Offers</p>
              </Link>
            </div>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="font-semibold">
              Customer Service
            </h3>

            <div className="mt-4 space-y-3 text-sm text-gray-400">
              <Link to="/contact">
                <p>Contact Us</p>
                <p>Shipping Information</p>
                <p>Returns & Refunds</p>
                <p>FAQs</p>
              </Link>
              
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-semibold">
              Stay Updated
            </h3>

            <p className="mt-4 text-sm text-gray-400">
              Get product updates and exclusive
              offers.
            </p>

            <div className="mt-5 flex">
              <input
                type="email"
                placeholder="Your email"
                className="min-w-0 flex-1 rounded-l-lg bg-white px-4 py-3 text-sm text-black outline-none"
              />

              <button className="rounded-r-lg bg-gray-800 px-4 text-sm font-semibold hover:bg-gray-700">
                Join
              </button>
            </div>
          </div>

        </div>

        <div className="mt-12 border-t border-gray-800 pt-6 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} NOVA. All rights reserved.
        </div>

      </div>
    </footer>
  );
};

export default Footer;