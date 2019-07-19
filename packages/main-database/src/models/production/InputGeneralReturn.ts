import {Column, ForeignKey, Table} from "@simplism/orm-query";
import {Company} from "../base-info/Company";
import {Employee} from "../base-info/Employee";
import {DateOnly, DateTime} from "@simplism/core";
import {Goods} from "../base-info/Goods";
import {MixingProcess} from "./MixingProcess";
import {LotHistory, Warehouse} from "../..";

@Table({description: "일반반납"})
export class InputGeneralReturn {
  @Column({description: "아이디", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "회사 아이디"})
  public companyId!: number;

  @Column({description: "반납일"})
  public returnDate!: DateOnly;

  @Column({description: "배합처리 아이디"})
  public mixingProcessId!: number;

  @Column({description: "품목"})
  public goodsId!: number;

  @Column({description: "반납 LOT", nullable: true})
  public returnLotId?: number;

  @Column({description: "반납 수량", nullable: true, dataType: "DECIMAL(17,6)"})
  public quantity?: number;

  @Column({description: "반납 창고"})
  public warehouseId!: number;

  @Column({description: "작성자 아이디"})
  public createdByEmployeeId!: number;

  @Column({description: "작성일시"})
  public createdAtDateTime!: DateTime;

  @Column({description: "ss_materials_input_key", nullable: true})
  public smiKey?: number;

  @Column({description: "ss_product_inout_key", nullable: true})
  public spiKey?: number;


  //------------------------------------

  @ForeignKey("companyId", () => Company, "회사")
  public company?: Company;

  @ForeignKey("goodsId", () => Goods, "품목")
  public goods?: Goods;

  @ForeignKey("returnLotId", () => LotHistory, "LOT")
  public lot?: LotHistory;

  @ForeignKey("mixingProcessId", () => MixingProcess, "배합처리")
  public mixingProcess?: MixingProcess;

  @ForeignKey("warehouseId", () => Warehouse, "창고")
  public warehouse?: Warehouse;

  @ForeignKey("createdByEmployeeId", () => Employee, "작성자")
  public employee?: Employee;

  //------------------------------------


}