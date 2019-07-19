import {Column, ForeignKey, ForeignKeyTarget, Table} from "@simplism/orm-query";
import {Company} from "../base-info/Company";
import {Employee} from "../base-info/Employee";
import {DateTime} from "@simplism/core";
import {Goods} from "../base-info/Goods";
import {ProductionInstruction} from "./ProductionInstruction";
import {InputHistory} from "./InputHistory";
import {InputGeneralReturn} from "./InputGeneralReturn";
import {InputLdpeReturn} from "./InputLdpeReturn";
import {Equipment} from "../..";

@Table({description: "배합처리"})
export class MixingProcess {
  @Column({description: "아이디", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "회사 아이디"})
  public companyId!: number;

  @Column({description: "생산지시 아이디"})
  public productionOrderId!: number;

  @Column({description: "설비 아이디"})
  public equipmentId!: number;

  @Column({description: "품목"})
  public goodsId!: number;

  @Column({description: "생산량", dataType: "DECIMAL(17,6)", nullable: true})
  public productionQuantity?: number;

  @Column({description: "비고", nullable: true})
  public remark?: string;

  @Column({description: "작성자 아이디"})
  public createdByEmployeeId!: number;

  @Column({description: "작성일시"})
  public createdAtDateTime!: DateTime;

  @Column({description: "수정자 아이디", nullable: true})
  public modifyByEmployeeId?: number;

  @Column({description: "수정일시", nullable: true})
  public modifyAtDateTime?: DateTime;

  //------------------------------------

  @ForeignKey("companyId", () => Company, "회사")
  public company?: Company;

  @ForeignKey("goodsId", () => Goods, "품목")
  public goods?: Goods;

  @ForeignKey("productionOrderId", () => ProductionInstruction, "생산지시")
  public productionInstruction?: ProductionInstruction;

  @ForeignKey("equipmentId", () => Equipment, "설비")
  public equipment?: Equipment;

  @ForeignKey("createdByEmployeeId", () => Employee, "작성자")
  public employee?: Employee;

  @ForeignKey("modifyByEmployeeId", () => Employee, "수정자")
  public modifyEmployee?: Employee;

  //------------------------------------

  @ForeignKeyTarget(() => InputHistory, "mixingProcess", "투입이력 목록")
  public inputHistory?: InputHistory[];

  @ForeignKeyTarget(() => InputGeneralReturn, "mixingProcess", "일반반납 목록")
  public inputGeneralReturn?: InputGeneralReturn[];

  @ForeignKeyTarget(() => InputLdpeReturn, "mixingProcess", "LDPE 목록")
  public inputLdpeReturn?: InputLdpeReturn[];

}