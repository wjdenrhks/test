import {Column, ForeignKey, Table} from "@simplism/orm-query";
import {Company} from "../base-info/Company";
import {Warehouse} from "../base-info/Warehouse";
import {Goods} from "../base-info/Goods";
import {LotHistory} from "./LotHistory";
import {Packing} from "./Packing";
import {DateOnly} from "@simplism/core";
import {ProductionItem} from "../..";

@Table({description: "재고"})
export class Stock {
  @Column({description: "아이디", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "회사 아이디"})
  public companyId!: number;

  @Column({description: "창고 아이디"})
  public warehouseId!: number;

  @Column({description: "팔레트 LOT", nullable: true})
  public paletteBarcodeId?: number;

  @Column({description: "생산 아이디", nullable: true})
  public productionItemId?: number;

  @Column({description: "LOT", nullable: true})
  public lotId?: number;

  @Column({description: "제품 아이디"})
  public goodsId!: number;

  @Column({description: "재고량", dataType: "DECIMAL(17,6)"})
  public quantity!: number;

  @Column({description: "제품등급"})
  public rating!: "A" | "B" | "C" | "공통";

  @Column({description: "일자정보"})
  public stockDate!: DateOnly;

  //------------------------------------

  @ForeignKey("companyId", () => Company, "회사")
  public company?: Company;

  @ForeignKey("warehouseId", () => Warehouse, "창고")
  public warehouse?: Warehouse;

  @ForeignKey("productionItemId", () => ProductionItem, "생산항목")
  public productionItem?: ProductionItem;

  @ForeignKey("paletteBarcodeId", () => Packing, "팔레트 바코드")
  public paletteBarcode?: Packing;

  @ForeignKey("lotId", () => LotHistory, "LOT")
  public lot?: LotHistory;

  @ForeignKey("goodsId", () => Goods, "품목")
  public goods?: Goods;
}