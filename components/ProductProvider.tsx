'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type Product = '美图秀秀' | '美颜相机' | 'Wink'

const PRODUCTS: Product[] = ['美图秀秀', '美颜相机', 'Wink']
const STORAGE_KEY = 'selectedProduct'

type ProductContextType = {
  product: Product
  setProduct: (p: Product) => void
  products: Product[]
}

const ProductContext = createContext<ProductContextType>({
  product: '美图秀秀',
  setProduct: () => {},
  products: PRODUCTS,
})

export function ProductProvider({ children }: { children: ReactNode }) {
  const [product, setProductState] = useState<Product>('美图秀秀')

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Product | null
    if (saved && PRODUCTS.includes(saved)) setProductState(saved)
  }, [])

  const setProduct = (p: Product) => {
    setProductState(p)
    localStorage.setItem(STORAGE_KEY, p)
  }

  return (
    <ProductContext.Provider value={{ product, setProduct, products: PRODUCTS }}>
      {children}
    </ProductContext.Provider>
  )
}

export function useProduct() {
  return useContext(ProductContext)
}
