import {Column, ForeignKey, Table} from "@simplism/orm-query";
import {Equipment} from "./Equipment";


@Table({description: "설비 비가동 시간"})
export class EquipmentStopInfo {
  @Column({description: "아이디", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "설비번호", nullable: true})
  public equipmentId?: number;

  @Column({description: "비가동 시간(분)"})
  public offTime!: number;

  //------------------------------------

  @ForeignKey("equipmentId", () => Equipment, "설비")
  public equipment?: Equipment;

}