import SaleHero from "@/components/SaleHero";
import ShopCatalog from "@/components/ShopCatalog";

export default function SalePage() {
  return <><SaleHero /><div id="sale-products" className="sale-catalog"><ShopCatalog initialCategory="sale" /></div></>;
}
