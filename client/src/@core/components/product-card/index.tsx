"use client";

import { OPTIONS_ICON } from "../../../utils/images/icons";
import { formatPriceARS } from "../../../utils/functions";
import { useRouter } from "next/router";
import React, { useEffect, useState, useRef } from "react";
import { ToastContainer, toast } from "react-toastify";

const ProductsManagement = () => {
  const router = useRouter();

  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const dropdownRef = useRef<any>(null);

  const fetchProducts = async () => {
    const response = await fetch("/api/products");
    if (response.ok) {
      const data = await response.json();
      setProducts(data);
    }
  };

  const handleDelete = async (productId: string) => {
    const response = await fetch(`/api/delete-product/${productId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      fetchProducts();

      toast.success("1 producto ha sido eliminado.", {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    } else {
      alert("Failed to delete product");
    }
  };

  const handleClickOutside = (event: any) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setSelectedProduct(null);
    }
  };

  const handleEsc = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      setSelectedProduct(null);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:py-8">
      {products.map((product) => (
        <div
          className="shadow rounded-lg p-4 relative bg-white"
          key={product._id}
        >
          <img
            src={OPTIONS_ICON}
            alt="Options"
            className="w-4 object-cover cursor-pointer absolute top-2 right-2"
            onClick={() => setSelectedProduct(product._id)}
          />
          {selectedProduct === product._id && (
            <div
              ref={dropdownRef}
              className="absolute right-0 mt-2 w-28 bg-white rounded-md overflow-hidden shadow-xl z-10"
            >
              {/* <Link
                href={`/my-account/admin/edit-product/${product._id}`}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Edit
              </Link> */}
              <div
                onClick={() => handleDelete(product._id)}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 cursor-pointer"
              >
                Delete
              </div>
            </div>
          )}

          <img
            src={product.mainImageUrl}
            alt={product.name}
            className="w-40 mt-5 mx-auto rounded-full object-cover"
          />
          <div className="mt-5 flex flex-col items-center">
            <h3 className="font-bold text-[1.1rem]">{product.name}</h3>
            <p className="text-yellow-800 mt-1">
              {formatPriceARS(product.price)}
            </p>
          </div>
        </div>
      ))}

      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
};

export default ProductsManagement;
