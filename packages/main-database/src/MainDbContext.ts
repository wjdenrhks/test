import {Type} from "@simplism/core";
import {DbContext, IDbMigration, Queryable} from "@simplism/orm-client";
import {IDbConnectionConfig} from "@simplism/orm-common";
import {Company} from "./models/base-info/Company";
import {Employee} from "./models/base-info/Employee";
import {Auth} from "./models/system/Auth";
import {BaseType} from "./models/base-info/BaseType";
import {CompanyConfig} from "./models/base-info/CompanyConfig";


import {Goods} from "./models/base-info/Goods";

import {Partner} from "./models/base-info/Partner";

import {Warehouse} from "./models/base-info/Warehouse";


import {Stock} from "./models/inventory/Stock";
import {StockAdjustment} from "./models/inventory/StockAdjustment";
import {StockTransfer} from "./models/inventory/StockTransfer";
import {AvailableStock} from "./models/inventory/AvailableStock";
import {Equipment} from "./models/base-info/Equipment";
import {Production} from "./models/production/Production";
import {ProductionInstruction} from "./models/production/ProductionInstruction";

import {GoodsInspection} from "./models/base-info/GoodsInspection";
import {Unit} from "./models/base-info/Unit";
import {Alarm} from "./models/system/Alarm";
import {GoodsReceipt} from "./models/goods-transaction/GoodsReceipt";
import {GoodsReceiptInspection} from "./models/inspection/GoodsReceiptInspection";
import {GoodsIssue} from "./models/goods-transaction/GoodsIssue";
import {GoodsIssueGoods} from "./models/goods-transaction/GoodsIssueGoods";


import {ProductionPlan} from "./models/production/ProductionPlan";
import {RepairByEquipment} from "./models/base-info/RepairByEquipment";
import {EquipmentByEquipment} from "./models/base-info/EquipmentByEquipment";
import {ErpSync} from "./models/system/ErpSync";
import {ProductionInfo} from "./models/base-info/ProductionInfo";
import {EquipmentByGoods} from "./models/base-info/EquipmentByGoods";
import {GoodsBuild} from "./models/base-info/GoodsBuild";
import {GoodsBuildGoods} from "./models/base-info/GoodsBuildGoods";
import {ProductionPlanItem} from "./models/production/ProductionPlanItem";
import {ResponsibleManager} from "./models/production/ResponsibleManager";
import {QuantityCheckInspection} from "./models/inspection/QuantityCheckInspection";
import {LotTransfer} from "./models/inventory/LotTransfer";
import {Packing} from "./models/inventory/Packing";
import {PackingItem} from "./models/inventory/PackingItem";
import {ProductionInstructionItem} from "./models/production/ProductionInstructionItem";
import {GoodsIssuePlan} from "./models/goods-transaction/GoodsIssuePlan";
import {GoodsIssuePlanItem} from "./models/goods-transaction/GoodsIssuePlanItem";
import {Scrap} from "./models/inspection/Scrap";
import {QuantityCheckInspectionItem} from "./models/inspection/QuantityCheckInspectionItem";
import {ProductionItem} from "./models/production/ProductionItem";
import {PushProcess} from "./models/production/PushProcess";
import {MixingProcess} from "./models/production/MixingProcess";
import {InputLdpeReturn} from "./models/production/InputLdpeReturn";
import {InputGeneralReturn} from "./models/production/InputGeneralReturn";
import {InputHistory} from "./models/production/InputHistory";
import {UserGroupPermission} from "./models/base-info/UserGroupPermission";
import {UserGroup} from "./models/base-info/UserGroup";
import {GoodsBuildList} from "./models/base-info/GoodsBuildList";
import {GoodsProductionGoods} from "./models/base-info/GoodsProductionGoods";
import {GoodsSaleGoods} from "./models/base-info/GoodsSaleGoods";
import {LotHistory} from "./models/inventory/LotHistory";
import {ProductionWeight} from "./models/production/ProductionWeight";
import {StockClosed} from "./models/inventory/StockClosed";
import {PushProcessItem} from "./models/production/PushProcessItem";
import {ProductionEquipmentInfo} from "./models/production/ProductionEquipmentInfo";
import {GoodsInspectionChart} from "./models/base-info/GoodsInspectionChart";
import {InspectionItem} from "./models/inspection/InspectionItem";
import {ProductionInputEmployee} from "./models/production/ProductionInputEmployee";
import {GoodsIssueReport} from "./models/goods-transaction/GoodsIssueReport";
import {RewindProcess} from "./models/production/RewindProcess";
import {RewindReport} from "./models/production/RewindReport";
import {GoodsGroup} from "./models/base-info/GoodsGroup";
import {GoodsGroupItem} from "./models/base-info/GoodsGroupItem";
import {Assets} from "./models/system/Assets";
import {GoodsGroupProductionGoods} from "./models/base-info/GoodsGroupProductionGoods";
import {GoodsBuildGroupItem} from "./models/base-info/GoodsBuildGroupItem";


export class MainDbContext extends DbContext {
  public baseType = new Queryable(this, BaseType);
  public company = new Queryable(this, Company);
  public companyConfig = new Queryable(this, CompanyConfig);
  public employee = new Queryable(this, Employee);
  public equipment = new Queryable(this, Equipment);
  public productionInfo = new Queryable(this, ProductionInfo);
  public goods = new Queryable(this, Goods);
  public goodsProductionGoods = new Queryable(this, GoodsProductionGoods);
  public goodsSaleGoods = new Queryable(this, GoodsSaleGoods);
  public goodsBuild = new Queryable(this, GoodsBuild);
  public goodsBuildList = new Queryable(this, GoodsBuildList);
  public goodsBuildGoods = new Queryable(this, GoodsBuildGoods);
  public goodsInspection = new Queryable(this, GoodsInspection);
  public equipmentByGoods = new Queryable(this, EquipmentByGoods);
  public partner = new Queryable(this, Partner);
  public unit = new Queryable(this, Unit);
  public warehouse = new Queryable(this, Warehouse);
  public repairByEquipment = new Queryable(this, RepairByEquipment);
  public equipmentByEquipment = new Queryable(this, EquipmentByEquipment);
  public userGroup = new Queryable(this, UserGroup);
  public userGroupPermission = new Queryable(this, UserGroupPermission);
  public goodsInspectionChart = new Queryable(this, GoodsInspectionChart);
  public goodsGroup = new Queryable(this, GoodsGroup);
  public goodsGroupItem = new Queryable(this, GoodsGroupItem);
  public goodsGroupProductionGoods = new Queryable(this, GoodsGroupProductionGoods);
  public goodsBuildGroupItem = new Queryable(this, GoodsBuildGroupItem);

  public goodsReceipt = new Queryable(this, GoodsReceipt);
  public goodsIssue = new Queryable(this, GoodsIssue);
  public goodsIssueGoods = new Queryable(this, GoodsIssueGoods);
  public goodsIssuePlan = new Queryable(this, GoodsIssuePlan);
  public goodsIssuePlanItem = new Queryable(this, GoodsIssuePlanItem);
  public goodsIssueReport = new Queryable(this, GoodsIssueReport);

  public goodsReceiptInspection = new Queryable(this, GoodsReceiptInspection);
  public quantityCheckInspection = new Queryable(this, QuantityCheckInspection);
  public quantityCheckInspectionItem = new Queryable(this, QuantityCheckInspectionItem);
  public inspectionItem = new Queryable(this, InspectionItem);
  public scrap = new Queryable(this, Scrap);

  public availableStock = new Queryable(this, AvailableStock);
  public stock = new Queryable(this, Stock);
  public stockAdjustment = new Queryable(this, StockAdjustment);
  public stockTransfer = new Queryable(this, StockTransfer);
  public stockClosed = new Queryable(this, StockClosed);
  public lotHistory = new Queryable(this, LotHistory);
  public lotTransfer = new Queryable(this, LotTransfer);
  public packing = new Queryable(this, Packing);
  public packingItem = new Queryable(this, PackingItem);

  public production = new Queryable(this, Production);
  public productionWeight = new Queryable(this, ProductionWeight);
  public productionItem = new Queryable(this, ProductionItem);
  public productionPlan = new Queryable(this, ProductionPlan);
  public productionPlanItem = new Queryable(this, ProductionPlanItem);
  public productionInstruction = new Queryable(this, ProductionInstruction);
  public productionInstructionItem = new Queryable(this, ProductionInstructionItem);
  public responsibleManager = new Queryable(this, ResponsibleManager);
  public inputHistory = new Queryable(this, InputHistory);
  public inputGeneralReturn = new Queryable(this, InputGeneralReturn);
  public inputLdpeReturn = new Queryable(this, InputLdpeReturn);
  public mixingProcess = new Queryable(this, MixingProcess);
  public pushProcess = new Queryable(this, PushProcess);
  public pushProcessItem = new Queryable(this, PushProcessItem);
  public productioinEquipmnetInfo = new Queryable(this, ProductionEquipmentInfo);
  public productionInputEmployee = new Queryable(this, ProductionInputEmployee);
  public rewindProcess = new Queryable(this, RewindProcess);
  public rewindReport = new Queryable(this, RewindReport);


  public alarm = new Queryable(this, Alarm);
  public assets = new Queryable(this, Assets);
  public auth = new Queryable(this, Auth);
  public erpSync = new Queryable(this, ErpSync);


  public get config(): IDbConnectionConfig {
    return process.env.DB_CONNECTION as any;
  }

  public get migrations(): Type<IDbMigration>[] {
    return [];
  }
}