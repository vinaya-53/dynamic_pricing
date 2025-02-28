export interface Product{
    product_id: string;
    product_name: string;
    product_costs: number[];
    ratings: number[];
  }
  
export  interface Category  {
    _id: string;
    category: string;
    d_weight: number;
    p_weight: number;
    r_weight: number;
    products: Product[];
  }
  