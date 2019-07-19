import {Company} from "./Company";
import {Column, ForeignKey, Table} from "@simplism/orm-query";
import {DateTime} from "@simplism/core";
import {Employee} from "./Employee";

@Table({description: "품목"})
export class Goods {
  @Column({description: "아이디", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "회사 아이디"})
  public companyId!: number;

  @Column({description: "명칭"})
  public name!: string;

  @Column({description: "구분", nullable: true})
  public type?: string;

  @Column({description: "용도", nullable: true})
  public purpose?: string;

  @Column({description: "분류", nullable: true})
  public category?: string;

  @Column({description: "규격", nullable: true})
  public specification?: string;

  @Column({description: "두께", nullable: true})
  public thick?: number;

  @Column({description: "중량", dataType: "DECIMAL(11,2)", nullable: true})
  public weight?: number;

  @Column({description: "단위", nullable: true})
  public unitName?: string;

  @Column({description: "단가", dataType: "DECIMAL(17,6)", nullable: true})
  public unitPrice?: number;

  @Column({description: "재고량", nullable: true})
  public stockQuantity?: number;

  @Column({description: "로스율", nullable: true})
  public lossQuantity?: number;

  @Column({description: "길이", nullable: true})
  public length?: number;

  @Column({description: "ERP단위 아이디", nullable: true})
  public unitId?: number;

  @Column({description: "적정재고", nullable: true})
  public adequateStock?: number;

  @Column({description: "적정재고율", nullable: true})
  public adequateStockRate?: number;

  @Column({description: "비고", nullable: true})
  public remark?: string;

  @Column({description: "사용중지여부", nullable: true})
  public isDisabled?: boolean;

  @Column({description: "등록자", nullable: true})
  public createdByEmployeeId?: number;

  @Column({description: "등록일", nullable: true})
  public createdAtDateTime?: DateTime;

  @Column({description: "ERP 아이디"})
  public erpSyncCode!: number;

  //------------------------------------

  @ForeignKey("companyId", () => Company, "회사")
  public company?: Company;

  @ForeignKey("createdByEmployeeId", () => Employee, "등록자")
  public employee?: Employee;

  //------------------------------------
}