import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

// Type definitions
export type ProductCategory = Tables<"product_categories">;

export type Product = Tables<"products"> & {
  category?: Pick<ProductCategory, "id" | "name" | "slug"> | null;
};

export type ProductWithRelations = Product & {
  companies?: Array<{
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
  }>;
  articles?: Array<{
    id: string;
    title: string;
    slug: string;
    hero_image_url: string | null;
  }>;
};

// ============================================
// CATEGORY HOOKS
// ============================================

export function useProductCategories() {
  return useQuery({
    queryKey: ["product-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_categories")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as ProductCategory[];
    },
  });
}

export function useProductCategoryBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ["product-category", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_categories")
        .select("*")
        .eq("slug", slug!)
        .maybeSingle();

      if (error) throw error;
      return data as ProductCategory | null;
    },
    enabled: !!slug,
  });
}

// ============================================
// PRODUCT LISTING HOOKS
// ============================================

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          category:product_categories(id, name, slug)
        `)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as Product[];
    },
  });
}

export function useProductsByCategory(categorySlug: string | undefined) {
  return useQuery({
    queryKey: ["products", "category", categorySlug],
    queryFn: async () => {
      // First get the category ID
      const { data: category, error: categoryError } = await supabase
        .from("product_categories")
        .select("id")
        .eq("slug", categorySlug!)
        .maybeSingle();

      if (categoryError) throw categoryError;
      if (!category) return [];

      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          category:product_categories(id, name, slug)
        `)
        .eq("category_id", category.id)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as Product[];
    },
    enabled: !!categorySlug,
  });
}

export function useProductBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          category:product_categories(id, name, slug)
        `)
        .eq("slug", slug!)
        .maybeSingle();

      if (error) throw error;
      return data as Product | null;
    },
    enabled: !!slug,
  });
}

// ============================================
// RELATION HOOKS
// ============================================

export function useProductManufacturers(productId: string | undefined) {
  return useQuery({
    queryKey: ["product-manufacturers", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_companies")
        .select(`
          company:companies(id, name, slug, logo_url, headquarters)
        `)
        .eq("product_id", productId!);

      if (error) throw error;
      return data?.map((item) => item.company).filter(Boolean) as Array<{
        id: string;
        name: string;
        slug: string;
        logo_url: string | null;
        headquarters: string | null;
      }>;
    },
    enabled: !!productId,
  });
}

export function useProductArticles(productId: string | undefined) {
  return useQuery({
    queryKey: ["product-articles", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_articles")
        .select(`
          article:articles(id, title, subtitle, slug, hero_image_url, publish_date)
        `)
        .eq("product_id", productId!);

      if (error) throw error;
      return data?.map((item) => item.article).filter(Boolean) as Array<{
        id: string;
        title: string;
        subtitle: string | null;
        slug: string;
        hero_image_url: string | null;
        publish_date: string | null;
      }>;
    },
    enabled: !!productId,
  });
}

export function useRelatedProducts(
  productSlug: string | undefined,
  categoryId: string | undefined,
  limit: number = 4
) {
  return useQuery({
    queryKey: ["related-products", productSlug, categoryId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          category:product_categories(id, name, slug)
        `)
        .eq("category_id", categoryId!)
        .neq("slug", productSlug!)
        .order("sort_order", { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data as Product[];
    },
    enabled: !!productSlug && !!categoryId,
  });
}

export function useProductExecutives(productId: string | undefined) {
  return useQuery({
    queryKey: ["product-executives", productId],
    queryFn: async () => {
      // Get companies linked to this product
      const { data: productCompanies, error: pcError } = await supabase
        .from("product_companies")
        .select("company_id")
        .eq("product_id", productId!);

      if (pcError) throw pcError;
      if (!productCompanies?.length) return [];

      const companyIds = productCompanies.map((pc) => pc.company_id);

      // Get executives from those companies
      const { data, error } = await supabase
        .from("executives")
        .select("id, name, title, slug, photo_url, company_name")
        .in("company_id", companyIds);

      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });
}

// ============================================
// STATISTICS HOOK
// ============================================

export function useProductStats() {
  return useQuery({
    queryKey: ["product-stats"],
    queryFn: async () => {
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("id, category_id");

      if (productsError) throw productsError;

      const { data: categories, error: categoriesError } = await supabase
        .from("product_categories")
        .select("id, name, slug");

      if (categoriesError) throw categoriesError;

      const productsByCategory = categories?.map((category) => ({
        ...category,
        count: products?.filter((p) => p.category_id === category.id).length || 0,
      }));

      return {
        totalProducts: products?.length || 0,
        totalCategories: categories?.length || 0,
        productsByCategory,
      };
    },
  });
}

// ============================================
// ADMIN PRODUCT HOOKS
// ============================================

export function useProductsAdmin() {
  return useQuery({
    queryKey: ["products-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          category:product_categories(id, name, slug)
        `)
        .order("name", { ascending: true });

      if (error) throw error;
      return data as Product[];
    },
  });
}

export function useProductById(id: string | undefined) {
  return useQuery({
    queryKey: ["product-by-id", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          category:product_categories(id, name, slug)
        `)
        .eq("id", id!)
        .maybeSingle();

      if (error) throw error;
      return data as Product | null;
    },
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: TablesInsert<"products">) => {
      const { data, error } = await supabase
        .from("products")
        .insert(product)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products-admin"] });
      queryClient.invalidateQueries({ queryKey: ["product-stats"] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: TablesUpdate<"products"> & { id: string }) => {
      const { data, error } = await supabase
        .from("products")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products-admin"] });
      queryClient.invalidateQueries({ queryKey: ["product", data.slug] });
      queryClient.invalidateQueries({ queryKey: ["product-by-id", data.id] });
      queryClient.invalidateQueries({ queryKey: ["product-stats"] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products-admin"] });
      queryClient.invalidateQueries({ queryKey: ["product-stats"] });
    },
  });
}

// ============================================
// ADMIN CATEGORY HOOKS
// ============================================

export function useCreateProductCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (category: TablesInsert<"product_categories">) => {
      const { data, error } = await supabase
        .from("product_categories")
        .insert(category)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-categories"] });
      queryClient.invalidateQueries({ queryKey: ["product-stats"] });
    },
  });
}

export function useUpdateProductCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: TablesUpdate<"product_categories"> & { id: string }) => {
      const { data, error } = await supabase
        .from("product_categories")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["product-categories"] });
      queryClient.invalidateQueries({ queryKey: ["product-category", data.slug] });
      queryClient.invalidateQueries({ queryKey: ["product-stats"] });
    },
  });
}

export function useDeleteProductCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("product_categories")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-categories"] });
      queryClient.invalidateQueries({ queryKey: ["product-stats"] });
    },
  });
}

// ============================================
// PRODUCT-COMPANY JUNCTION HOOKS
// ============================================

export function useLinkProductCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      companyId,
    }: {
      productId: string;
      companyId: string;
    }) => {
      const { error } = await supabase
        .from("product_companies")
        .insert({ product_id: productId, company_id: companyId });

      if (error) throw error;
    },
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({
        queryKey: ["product-manufacturers", productId],
      });
      queryClient.invalidateQueries({
        queryKey: ["product-executives", productId],
      });
    },
  });
}

export function useUnlinkProductCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      companyId,
    }: {
      productId: string;
      companyId: string;
    }) => {
      const { error } = await supabase
        .from("product_companies")
        .delete()
        .eq("product_id", productId)
        .eq("company_id", companyId);

      if (error) throw error;
    },
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({
        queryKey: ["product-manufacturers", productId],
      });
      queryClient.invalidateQueries({
        queryKey: ["product-executives", productId],
      });
    },
  });
}
