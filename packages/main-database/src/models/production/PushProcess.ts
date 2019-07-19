import {Column, ForeignKey, ForeignKeyTarget, Table} from "@simplism/orm-query";
import {Company} from "../base-info/Company";
import {Employee} from "../base-info/Employee";
import {DateTime} from "@simplism/core";
import {Goods} from "../base-info/Goods";
import {Equipment, LotHistory, PushProcessItem, Warehouse} from "../..";

@Table({description: "밀어내기"})
export class PushProcess {
  @Column({description: "아이디", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "회사 아이디"})
  public companyId!: number;

  @Column({description: "작업시간"})
  public dueDate!: DateTime;

  @Column({description: "구분"})
  public type!: "시작" | "종료";

  @Column({description: "투입 품목", nullable: true})
  public inputGoodsId?: number;

  @Column({description: "투입 LOT", nullable: true})
  public inputLotId?: number;

  @Column({description: "투입중량", dataType: "DECIMAL(17,6)", nullable: true})
  public inputWeight?: number;

  @Column({description: "투입창고", nullable: true})
  public inputWarehouseId?: number;

  @Column({description: "설비"})
  public equipmentId!: number;

  @Column({description: "작성자 아이디"})
  public createdByEmployeeId!: number;

  @Column({description: "작성일시"})
  public createdAtDateTime!: DateTime;

  @Column({description: "시작 아이디", nullable: true})
  public startId?: number;

  @Column({description: "종료 아이디", nullable: true})
  public finishId?: number;

  @Column({description: "수정자 아이디", nullable: true})
  public modifyByEmployeeId?: number;

  @Column({description: "수정일시", nullable: true})
  public modifyAtDateTime?: DateTime;

  @Column({description: "ss_materials_input_key", nullable: true})
  public smiKey?: number;

  @Column({description: "ss_product_inout_key", nullable: true})
  public spiKey?: number;


  //------------------------------------

  @ForeignKey("companyId", () => Company, "회사")
  public company?: Company;

  @ForeignKey("inputGoodsId", () => Goods, "투입 품목")
  public inputGoods?: Goods;

  @ForeignKey("inputLotId", () => LotHistory, "투입 LOT")
  public inputLot?: LotHistory;

  @ForeignKey("inputWarehouseId", () => Warehouse, "투입 창고")
  public inputWarehouse?: Warehouse;

  @ForeignKey("equipmentId", () => Equipment, "설비")
  public equipment?: Equipment;

  @ForeignKey("createdByEmployeeId", () => Employee, "작성자")
  public employee?: Employee;

  @ForeignKey("modifyByEmployeeId", () => Employee, "수정자")
  public modifyEmployee?: Employee;

  //------------------------------------

  @ForeignKeyTarget(() => PushProcessItem, "pushProcess", "밀어내기 별 산출품목")
  public pushProcessItems?: PushProcessItem[];
}