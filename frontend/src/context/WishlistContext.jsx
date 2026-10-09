import {
  createContext,
  useContext,
  useMemo,
} from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import api from "../services/api";
import { useAuth } from "./AuthContext";

const emptyWishlist = {
  products: [],
};

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = ["wishlist", user?._id || "guest"];

  const { data: wishlist = emptyWishlist, isLoading: loading, refetch: fetchWishlist } = useQuery({
    queryKey,
    enabled: !authLoading && Boolean(user),
    queryFn: async () => {
      const response = await api.get("/wishlist");
      return response.data.data;
    },
    onError: (error) => {
      console.error("Failed to fetch wishlist:", error);
      toast.error(error.response?.data?.message || "Failed to load wishlist.");
    },
    placeholderData: emptyWishlist,
  });

  const addToWishlist = useMutation({
    mutationFn: async (productId) => {
      const response = await api.post(`/wishlist/${productId}`);
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data);
      toast.success("Added to wishlist.");
    },
    onError: (error) => {
      const message = error.response?.data?.message || "Failed to add to wishlist.";
      toast.error(message);
    },
  });

  const removeFromWishlist = useMutation({
    mutationFn: async (productId) => {
      const response = await api.delete(`/wishlist/${productId}`);
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data);
      toast.success("Removed from wishlist.");
    },
    onError: (error) => {
      const message = error.response?.data?.message || "Failed to remove from wishlist.";
      toast.error(message);
    },
  });

  const clearWishlist = useMutation({
    mutationFn: async () => {
      const response = await api.delete("/wishlist");
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data);
      toast.success("Wishlist cleared.");
    },
    onError: (error) => {
      const message = error.response?.data?.message || "Failed to clear wishlist.";
      toast.error(message);
    },
  });

  const addToWishlistAction = async (productId) => {
    if (!user) {
      toast.error("Please login to use your wishlist.");
      return { success: false, requiresLogin: true };
    }

    const result = await addToWishlist.mutateAsync(productId);

    return { success: true, data: result };
  };

  const removeFromWishlistAction = async (productId) => {
    const result = await removeFromWishlist.mutateAsync(productId);

    return { success: true, data: result };
  };

  const toggleWishlist = async (productId) => {
    const exists = wishlist.products.some((product) => product._id === productId);

    if (exists) {
      return removeFromWishlistAction(productId);
    }

    return addToWishlistAction(productId);
  };

  const clearWishlistAction = async () => {
    const result = await clearWishlist.mutateAsync();

    return { success: true, data: result };
  };

  const wishlistCount = useMemo(() => {
    return wishlist.products.length;
  }, [wishlist.products]);

  const isInWishlist = (productId) => {
    return wishlist.products.some((product) => product._id === productId);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        loading,
        wishlistCount,
        fetchWishlist,
        addToWishlist: addToWishlistAction,
        removeFromWishlist: removeFromWishlistAction,
        toggleWishlist,
        clearWishlist: clearWishlistAction,
        isInWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);

  if (!context) {
    throw new Error("useWishlist must be used inside WishlistProvider");
  }

  return context;
};