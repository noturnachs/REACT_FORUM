import React, { useState, useEffect } from "react";
import { isTokenExpired } from "../utils/authUtils";
import { useNavigate } from "react-router-dom";

const StoreBody = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState(
    JSON.parse(localStorage.getItem("cart")) || []
  );

  const [products, setProducts] = useState([]);
  const [isCartVisible, setIsCartVisible] = useState(false);
  const [typeFilters, setTypeFilters] = useState({
    totes: false,
    tees: false,
    slings: false,
    hats: false,
    sweaters: false,
  });
  const [categoryFilters, setCategoryFilters] = useState({
    sas: false,
    soe: false,
    safad: false,
    sbe: false,
    sed: false,
    shcp: false,
    slg: false,
  });
  const [isTypeExpanded, setIsTypeExpanded] = useState(false);
  const [isCategoryExpanded, setIsCategoryExpanded] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || isTokenExpired(token)) {
      localStorage.removeItem("token");

      alert("Your session has expired. Please login again.");
      navigate("/api/login");
      return;
    }
  }, []);

  const handleToggleType = () => {
    setIsTypeExpanded((prevExpanded) => !prevExpanded);
  };

  const handleToggleCategory = () => {
    setIsCategoryExpanded((prevExpanded) => !prevExpanded);
  };

  const handleTypeChange = (type) => {
    setTypeFilters((prevFilters) => ({
      ...prevFilters,
      [type]: !prevFilters[type],
    }));
  };

  const deleteItem = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const handleCategoryChange = (category) => {
    setCategoryFilters((prevFilters) => ({
      ...prevFilters,
      [category]: !prevFilters[category],
    }));
  };

  const filteredProducts = products.filter((product) => {
    const categoryFilterPassed =
      categoryFilters[product.category] ||
      !Object.values(categoryFilters).some((filter) => filter);
    const typeFilterPassed =
      typeFilters[product.type] ||
      !Object.values(typeFilters).some((filter) => filter);

    return categoryFilterPassed && typeFilterPassed;
  });

  // Function to handle adding items to the cart
  const addToCart = (product) => {
    setCart((prevCart) => {
      // Check if the product is already in the cart
      const isProductInCart = prevCart.find((item) => item.id === product.id);
      if (isProductInCart) {
        // If already in cart, increase the quantity
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // If not in cart, add the product with quantity 1
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
  };

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // Fetch products from API Fetch products from API Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/products");
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };
    fetchProducts();
  }, []);

  // Function to handle increasing the quantity of an item in the cart
  const increaseQuantity = (productId) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  // Function to handle decreasing the quantity of an item in the cart
  const decreaseQuantity = (productId) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
    );
  };
  return (
    <>
      <div className="bg-white">
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-baseline justify-between border-b border-gray-200 pb-6 pt-24">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900">
              School Merch
            </h1>
          </div>
          <section aria-labelledby="products-heading" className="pb-24 pt-6">
            <h2 id="products-heading" className="sr-only">
              Products
            </h2>

            <div
              className="basket-icon btn bg-[#1d232a]"
              onClick={() => setIsCartVisible(!isCartVisible)}
            >
              <span>
                <i className="fa fa-shopping-basket text-white"></i>
              </span>
              <span>
                ({cart.reduce((acc, item) => acc + item.quantity, 0)})
              </span>
            </div>

            {/* Cart Modal */}
            {isCartVisible && (
              <div className="cart-modal">
                <div className="cart-content bg-[#1d232a] w-full p-2 rounded-lg mt-1">
                  <h2 className="text-white"></h2>

                  {cart.length === 0 ? (
                    <p className="text-lg text-white">Your cart is empty.</p>
                  ) : (
                    <div className="card card-compact w-full p-2 mt-2">
                      <ul>
                        {cart.map((item) => (
                          <li key={item.id}>
                            <div className="card card-compact w-full p-2 mt-2 text-white items-center">
                              <div className="flex flex-row">
                                <img
                                  src={item.imageSrc}
                                  alt=""
                                  width="200"
                                  height="100"
                                  className="rounded-lg"
                                />
                                <div className="flex flex-col ml-5">
                                  <span>{item.name}</span>
                                  <span>
                                    Qty:{" "}
                                    <input
                                      type="text"
                                      value={item.quantity}
                                      onChange={() => {}}
                                      min="1"
                                      className="w-12 text-center border border-gray-300 rounded"
                                    />
                                  </span>
                                  <div className="flex flex-col justify-center">
                                    <button
                                      onClick={() => increaseQuantity(item.id)}
                                      className="bg-green-100 hover:bg-green-200 text-green-800 font-bold py-1 px-2 rounded ml-2 mt-2"
                                    >
                                      +
                                    </button>
                                    <button
                                      onClick={() => decreaseQuantity(item.id)}
                                      className="bg-red-100 hover:bg-red-200 text-red-800 font-bold py-1 px-2 rounded ml-2 mt-2"
                                    >
                                      -
                                    </button>
                                    <button
                                      onClick={() => deleteItem(item.id)} // Handle item deletion
                                      className="bg-red-500 hover:bg-red-400 text-gray-800 font-bold py-1 px-2 rounded ml-2 mt-2"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-4">
              <form className="lg:block">
                <div className="border-b border-gray-200 py-6">
                  <h3 className="-my-3 flow-root">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between bg-white py-3 text-sm text-gray-400 hover:text-gray-500"
                      aria-controls="filter-section-1"
                      aria-expanded={isTypeExpanded}
                      onClick={handleToggleType}
                    >
                      <span className="font-medium text-gray-900">Type</span>
                      <span className="ml-6 flex items-center">
                        {isTypeExpanded ? (
                          <>
                            <svg
                              className="h-5 w-5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H4.75A.75.75 0 014 10z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </>
                        ) : (
                          <>
                            <svg
                              className="h-5 w-5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                            </svg>
                          </>
                        )}
                      </span>
                    </button>
                  </h3>
                  {isTypeExpanded && (
                    <div className="pt-6" id="filter-section-1">
                      <div className="space-y-4">
                        {Object.entries(typeFilters).map(([type, checked]) => (
                          <li key={type}>
                            <input
                              id={`filter-type-${type}`}
                              name="type[]"
                              value={type}
                              type="checkbox"
                              checked={checked}
                              onChange={() => handleTypeChange(type)}
                              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <label
                              htmlFor={`filter-type-${type}`}
                              className="ml-3 text-sm text-gray-600"
                            >
                              {type}
                            </label>
                          </li>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="border-b border-gray-200 py-6">
                  <h3 className="-my-3 flow-root">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between bg-white py-3 text-sm text-gray-400 hover:text-gray-500"
                      aria-controls="filter-section-1"
                      aria-expanded={isCategoryExpanded}
                      onClick={handleToggleCategory}
                    >
                      <span className="font-medium text-gray-900">
                        Category
                      </span>
                      <span className="ml-6 flex items-center">
                        {isCategoryExpanded ? (
                          <>
                            <svg
                              className="h-5 w-5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H4.75A.75.75 0 014 10z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </>
                        ) : (
                          <>
                            <svg
                              className="h-5 w-5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                            </svg>
                          </>
                        )}
                      </span>
                    </button>
                  </h3>
                  {isCategoryExpanded && (
                    <div className="pt-6" id="filter-section-1">
                      <div className="space-y-4">
                        {Object.entries(categoryFilters).map(
                          ([category, checked]) => (
                            <li key={category}>
                              <input
                                id={`filter-category-${category}`}
                                name="category[]"
                                value={category}
                                type="checkbox"
                                checked={checked}
                                onChange={() => handleCategoryChange(category)}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <label
                                htmlFor={`filter-category-${category}`}
                                className="ml-3 text-sm text-gray-600"
                              >
                                {category}
                              </label>
                            </li>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </form>
              <div className="lg:col-span-3">
                <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
                  <h2 className="sr-only">Products</h2>
                  <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
                    {filteredProducts.map((product) => (
                      <div key={product.id}>
                        <a href={product.href} className="group">
                          <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-lg bg-gray-200 xl:aspect-h-8 xl:aspect-w-7">
                            <img
                              src={product.imageSrc}
                              alt={product.imageAlt}
                              className="h-full w-full object-cover object-center group-hover:opacity-75"
                            />
                          </div>
                          <h3 className="mt-4 text-sm text-gray-700">
                            {product.name}
                          </h3>
                          <p className="mt-1 text-lg font-medium text-gray-900">
                            {product.price}
                          </p>
                        </a>
                        <button
                          onClick={() => addToCart(product)}
                          className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        >
                          Add to Cart
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
};

export default StoreBody;
