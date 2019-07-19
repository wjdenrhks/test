import {Company} from "./Company";
import {Column, ForeignKey, ForeignKeyTarget, Table} from "@simplism/orm-query";
import {DateTime} from "@simplism/core";
import {Employee} from "./Employee";
import {GoodsBuildList} from "./GoodsBuildList";
import {Goods} from "./Goods";
import {GoodsBuildGroupItem} from "./GoodsBuildGroupItem";


@Table({description: "BOM 정보"})
export class GoodsBuild {
  @Column({description: "아이디", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "회사 아이디"})
  public companyId!: number;

  @Column({description: "그룹명", nullable: true})
  public groupName?: string;

  @Column({description: "품목 아이디", nullable: true})
  public goodId?: number;

  @Column({description: "등록자"})
  public createdByEmployeeId!: number;

  @Column({description: "등록일"})
  public createdAtDateTime!: DateTime;

  @Column({description: "수정자", nullable: true})
  public modifyEmployeeId?: number;

  @Column({description: "수정일", nullable: true})
  public modifyAtDateTime?: DateTime;

  @Column({description: "사용중지"})
  public isDisabled!: boolean;

  //------------------------------------

  @ForeignKey("companyId", () => Company, "회사")
  public company?: Company;

  @ForeignKey("createdByEmployeeId", () => Employee, "등록자")
  public employee?: Employee;

  @ForeignKey("goodId", () => Goods, "제품")
  public goods?: Goods;

  @ForeignKey("modifyEmployeeId", () => Employee, "수정자")
  public modifyEmployee?: Employee;

  //------------------------------------

  @ForeignKeyTarget(() => GoodsBuildList, "bomInfo", "품목별 BOM 리스트")
  public goodsBuildList?: GoodsBuildList[];

  @ForeignKeyTarget(() => GoodsBuildGroupItem, "goodsBuildGroup", "그룹별 제품 리스트")
  public goodsBuildGroupItem?: GoodsBuildGroupItem[];
}