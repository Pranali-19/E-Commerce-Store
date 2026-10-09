import { createContext, useContext, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "../services/api";
import { useAuth } from "./AuthContext";

const emptyCart = {
  items: [],
  subtotal: 0,
  discount: 0,
  total: 0,
};

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = ["cart", user?._id || "guest"];

  const { data: cart = emptyCart, isLoading: loading, refetch: fetchCart } = useQuery({
    queryKey,
    enabled: !authLoading && Boolean(user),
    queryFn: async () => {
      const response = await api.get("/cart");
      return response.data.data;
    },
    onError: (error) => {
      console.error("Failed to fetch cart:", error);
      toast.error(error.response?.data?.message || "Failed to load cart.");
    },
    placeholderData: emptyCart,
  });

  const addToCart = useMutation({
    mutationFn: async ({ productId, quantity = 1 }) => {
      const response = await api.post("/cart/items", { productId, quantity });
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data);
      toast.success("Product added to cart!");
    },
    onError: (error) => {
      const message = error.response?.data?.message || "Failed to add product to cart.";
      toast.error(message);
    },
  });

  const updateQuantity = useMutation({
    mutationFn: async ({ productId, quantity }) => {
      const response = await api.put(`/cart/items/${productId}`, { quantity });
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || "Failed to update cart.";
      toast.error(message);
    },
  });

  const removeFromCart = useMutation({
    mutationFn: async (productId) => {
      const response = await api.delete(`/cart/items/${productId}`);
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data);
      toast.success("Product removed from cart.");
    },
    onError: (error) => {
      const message = error.response?.data?.message || "Failed to remove product.";
      toast.error(message);
    },
  });

  const clearCart = useMutation({
    mutationFn: async () => {
      const response = await api.delete("/cart");
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data);
      toast.success("Cart cleared.");
    },
    onError: (error) => {
      const message = error.response?.data?.message || "Failed to clear cart.";
      toast.error(message);
    },
  });

  const itemCount = useMemo(() => {
    return cart.items.reduce((total, item) => total + item.quantity, 0);
  }, [cart.items]);

  const addToCartAction = async (productId, quantity = 1) => {
    if (!user) {
      toast.error("Please login to add products to cart.");
      return { success: false, requiresLogin: true };
    }

    const result = await addToCart.mutateAsync({ productId, quantity });

    return {
      success: true,
      data: result,
    };
  };

  const updateQuantityAction = async (productId, quantity) => {
    const result = await updateQuantity.mutateAsync({ productId, quantity });

    return { success: true, data: result };
  };

  const removeFromCartAction = async (productId) => {
    const result = await removeFromCart.mutateAsync(productId);

    return { success: true, data: result };
  };

  const clearCartAction = async () => {
    const result = await clearCart.mutateAsync();

    return { success: true, data: result };
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        itemCount,
        fetchCart,
        addToCart: addToCartAction,
        updateQuantity: updateQuantityAction,
        removeFromCart: removeFromCartAction,
        clearCart: clearCartAction,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
};