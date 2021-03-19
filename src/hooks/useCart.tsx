import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      let newCart = [...cart];

      const { data: stock } = await api.get(`stock/${productId}`);

      const productIndex = cart.findIndex((p) => p.id === productId);

      if (productIndex >= 0) {
        if (stock.amount <= newCart[productIndex].amount) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }
        newCart[productIndex].amount += 1;
      } else {
        if (stock.amount < 1) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }
        const { data: product } = await api.get(`products/${productId}`);
        newCart.push({ ...product, amount: 1 });
      }

      setCart(newCart);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productIndex = cart.findIndex((p) => p.id === productId);

      if (productIndex < 0) {
        throw new Error();
      }

      const newCart = [...cart];

      newCart.splice(productIndex, 1);

      setCart(newCart);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const { data: stock } = await api.get(`stock/${productId}`);

      if (stock.amount < amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const newCart = [...cart];

      const productIndex = cart.findIndex((p) => p.id === productId);

      if (productIndex < 0 || amount < 1) {
        throw new Error();
      }

      newCart[productIndex].amount = amount;

      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
