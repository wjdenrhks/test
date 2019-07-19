import {AuthProc, MainDbContext} from "@sample/main-database";
import {Title} from "@angular/platform-browser";
import {SdLocalStorageProvider, SdOrmProvider, SdSocketProvider} from "@simplism/angular";
import {AppDataProvider} from "./providers/AppDataProvider";
/*import {DateOnly, DateTime} from "@simplism/core";
import {Md5} from "ts-md5";*/

export class AppInitializer {
  public static async initializeAsync(titleProvider: Title,
                                      localStorageProvider: SdLocalStorageProvider,
                                      socketProvider: SdSocketProvider,
                                      ormProvider: SdOrmProvider,
                                      appDataProvider: AppDataProvider): Promise<void> {
    titleProvider.setTitle("삼성그라테크 MES");
    localStorageProvider.prefix = process.env.PACKAGE_NAME!;
    await socketProvider.connectAsync(Number(process.env.SERVER_PORT));

    if (process.env.NODE_ENV !== "production") {
      localStorageProvider.set("authId", 1);
    }

    if (!module["hot"] || !module["hot"]["data"]) {
      await ormProvider.connectAsync(
        MainDbContext,
        async db => {
          // const mainDatabaseName = db.config.database;
          //기초정보 아무것도 없는 초기화
          /*const isInitialized = await db.initializeAsync([mainDatabaseName], process.env.NODE_ENV !== "production");

          if (isInitialized) {
            db.company.insertRangePrepare([
              {
                id: 1,
                name: "삼성그라테크"
              }
            ]);

            const companyConfig: [number, string, any][] = [
              [1, "base-info.base-type", true],
              [1, "base-info.partner", true],
              [1, "base-info.goods", true],
              [1, "base-info.production-info", true],
              [1, "base-info.goods-build", true],
              [1, "base-info.equipment", true],
              [1, "base-info.warehouse", true],
              [1, "base-info.employee", true],
              [1, "base-info.employee-permission", true],
              [1, "production.production-plan", true],
              [1, "production.production-instruction", true],
              [1, "goods-transaction.goods-receipt", true],
              [1, "goods-transaction.stock-transfer", true],
              [1, "goods-transaction.stock-adjustment", true],
              [1, "goods-transaction.stock-current", true],
              [1, "goods-transaction.stock-warehouse-current", true],
              [1, "goods-transaction.lot-trans", true],
              [1, "goods-transaction.packing", true],
              [1, "process.combination-process", true],
              [1, "process.process-push", true],
              [1, "process.process-production", true],
              [1, "process.process-rewind", true],
              [1, "process.weight-measurement", true],
              [1, "process.lot-history", true],
              [1, "inspection.receipt-inspection", true],
              [1, "inspection.qc-inspection", true],
              [1, "inspection.first-middle-last-inspection", true],
              [1, "inspection.final-inspection", true],
              [1, "shipment.shipping-plan", true],
              [1, "shipment.shipping-register", true],
              [1, "shipment.shipping-history", true],
              [1, "document.production-instruction-report", true],
              [1, "document.scrap-status", true],
              [1, "document.good-scrap-status", true],
              [1, "document.production-loss-status", true],
              [1, "document.quarterly-production-status", true],
              [1, "document.equipment-input-material-status", true],
              [1, "document.group-production-status", true],
              [1, "document.group-loss-status", true],
              [1, "document.rewind-status", true],
              [1, "document.equipment-production-personnel-status", true],
              [1, "document.purchase-status", true]
            ];

            db.companyConfig.insertRangePrepare(companyConfig.map((item, i) => ({
              id: i + 1,
              companyId: item[0],
              code: item[1],
              valueJson: JSON.stringify(item[2])
            })));

            db.erpSync.insertRangePrepare([{code: "Employee", syncDate: new DateTime().addYears(-10)}]);
            db.erpSync.insertRangePrepare([{code: "Partner", syncDate: new DateTime().addYears(-10)}]);
            db.erpSync.insertRangePrepare([{code: "Equipment", syncDate: new DateTime().addYears(-10)}]);
            db.erpSync.insertRangePrepare([{code: "Goods", syncDate: new DateTime().addYears(-10)}]);

            db.userGroup.insertRangePrepare([
              {
                id: 1,
                companyId: 1,
                name: "관리자"
              }
            ]);

            const employeePermission: [number, number, string, any][] = [
              [1, 1, "base-info.base-type", true],
              [1, 1, "base-info.partner", true],
              [1, 1, "base-info.goods", true],
              [1, 1, "base-info.production-info", true],
              [1, 1, "base-info.goods-build", true],
              [1, 1, "base-info.equipment", true],
              [1, 1, "base-info.warehouse", true],
              [1, 1, "base-info.employee", true],
              [1, 1, "base-info.employee-permission", true],
              [1, 1, "production.production-plan", true],
              [1, 1, "production.production-instruction", true],
              [1, 1, "goods-transaction.goods-receipt", true],
              [1, 1, "goods-transaction.stock-transfer", true],
              [1, 1, "goods-transaction.stock-adjustment", true],
              [1, 1, "goods-transaction.stock-current", true],
              [1, 1, "goods-transaction.stock-warehouse-current", true],
              [1, 1, "goods-transaction.lot-trans", true],
              [1, 1, "goods-transaction.packing", true],
              [1, 1, "process.combination-process", true],
              [1, 1, "process.process-push", true],
              [1, 1, "process.process-production", true],
              [1, 1, "process.weight-measurement", true],
              [1, 1, "process.process-rewind", true],
              [1, 1, "process.lot-history", true],
              [1, 1, "inspection.receipt-inspection", true],
              [1, 1, "inspection.qc-inspection", true],
              [1, 1, "inspection.first-middle-last-inspection", true],
              [1, 1, "inspection.final-inspection", true],
              [1, 1, "shipment.shipping-plan", true],
              [1, 1, "shipment.shipping-register", true],
              [1, 1, "shipment.shipping-history", true],
              [1, 1, "document.production-instruction-report", true],
              [1, 1, "document.scrap-status", true],
              [1, 1, "document.good-scrap-status", true],
              [1, 1, "document.production-loss-status", true],
              [1, 1, "document.quarterly-production-status", true],
              [1, 1, "document.equipment-input-material-status", true],
              [1, 1, "document.group-production-status", true],
              [1, 1, "document.group-loss-status", true],
              [1, 1, "document.rewind-status", true],
              [1, 1, "document.equipment-production-personnel-status", true],
              [1, 1, "document.purchase-status", true]
            ];

            db.userGroupPermission.insertRangePrepare(employeePermission.map(item => ({
              companyId: item[0],
              userGroupId: item[1],
              code: item[2],
              valueJson: JSON.stringify(item[3])
            })));

            await db.executePreparedAsync();

            db.employee.insertRangePrepare([
              {
                id: 1,
                companyId: 1,
                userId: "master",
                name: "관리자",
                groupId: 1,
                code: "11111",
                encryptedPassword: String(new Md5().appendStr("1234").end()),
                isDisabled: false
              },
              {
                id: 2,
                companyId: 1,
                userId: "user",
                name: "사용자",
                groupId: 1,
                code: "22222",
                encryptedPassword: String(new Md5().appendStr("1234").end()),
                isDisabled: false
              }
            ]);

            db.auth.insertRangePrepare([{
              id: 1,
              employeeId: 1,
              createdAtDateTime: new DateTime()
            }]);
            await db.executePreparedAsync();
          }*/

          //기본적인 정보 있는 초기화
          /*const isInitialized = await db.initializeAsync([mainDatabaseName], process.env.NODE_ENV !== "production");

          if (isInitialized) {
            db.company.insertRangePrepare([
              {
                id: 1,
                name: "삼성그라테크"
              }
            ]);

            const companyConfig: [number, string, any][] = [
              [1, "base-info.base-type", true],
              [1, "base-info.partner", true],
              [1, "base-info.goods", true],
              [1, "base-info.goods-group", true],
              [1, "base-info.production-info", true],
              [1, "base-info.goods-build", true],
              [1, "base-info.goods-build-group", true],
              [1, "base-info.equipment", true],
              [1, "base-info.warehouse", true],
              [1, "base-info.employee", true],
              [1, "base-info.employee-permission", true],
              [1, "production.production-plan", true],
              [1, "production.production-instruction", true],
              [1, "goods-transaction.goods-receipt", true],
              [1, "goods-transaction.stock-transfer", true],
              [1, "goods-transaction.stock-adjustment", true],
              [1, "goods-transaction.stock-current", true],
              [1, "goods-transaction.stock-warehouse-current", true],
              [1, "goods-transaction.lot-trans", true],
              [1, "goods-transaction.packing", true],
              [1, "process.combination-process", true],
              [1, "process.process-push", true],
              [1, "process.process-production", true],
              [1, "process.process-rewind", true],
              [1, "process.weight-measurement", true],
              [1, "process.lot-history", true],
              [1, "inspection.receipt-inspection", true],
              [1, "inspection.qc-inspection", true],
              [1, "inspection.first-middle-last-inspection", true],
              [1, "inspection.final-inspection", true],
              [1, "shipment.shipping-plan", true],
              [1, "shipment.shipping-register", true],
              [1, "shipment.shipping-history", true],
              [1, "document.production-instruction-report", true],
              [1, "document.scrap-status", true],
              [1, "document.good-scrap-status", true],
              [1, "document.production-loss-status", true],
              [1, "document.quarterly-production-status", true],
              [1, "document.equipment-input-material-status", true],
              [1, "document.group-production-status", true],
              [1, "document.group-loss-status", true],
              [1, "document.rewind-status", true],
              [1, "document.equipment-production-personnel-status", true],
              [1, "document.purchase-status", true]
            ];

            db.companyConfig.insertRangePrepare(companyConfig.map((item, i) => ({
              id: i + 1,
              companyId: item[0],
              code: item[1],
              valueJson: JSON.stringify(item[2])
            })));

            db.erpSync.insertRangePrepare([{code: "Employee", syncDate: new DateTime().addYears(-10)}]);
            db.erpSync.insertRangePrepare([{code: "Partner", syncDate: new DateTime().addYears(-10)}]);
            db.erpSync.insertRangePrepare([{code: "Equipment", syncDate: new DateTime().addYears(-10)}]);
            db.erpSync.insertRangePrepare([{code: "Goods", syncDate: new DateTime().addYears(-10)}]);

            db.userGroup.insertRangePrepare([
              {
                id: 1,
                companyId: 1,
                name: "관리자"
              }
            ]);

            const employeePermission: [number, number, string, any][] = [
              [1, 1, "base-info.base-type", true],
              [1, 1, "base-info.partner", true],
              [1, 1, "base-info.goods", true],
              [1, 1, "base-info.goods-group", true],
              [1, 1, "base-info.production-info", true],
              [1, 1, "base-info.goods-build", true],
              [1, 1, "base-info.goods-build-group", true],
              [1, 1, "base-info.equipment", true],
              [1, 1, "base-info.warehouse", true],
              [1, 1, "base-info.employee", true],
              [1, 1, "base-info.employee-permission", true],
              [1, 1, "production.production-plan", true],
              [1, 1, "production.production-instruction", true],
              [1, 1, "goods-transaction.goods-receipt", true],
              [1, 1, "goods-transaction.stock-transfer", true],
              [1, 1, "goods-transaction.stock-adjustment", true],
              [1, 1, "goods-transaction.stock-current", true],
              [1, 1, "goods-transaction.stock-warehouse-current", true],
              [1, 1, "goods-transaction.lot-trans", true],
              [1, 1, "goods-transaction.packing", true],
              [1, 1, "process.combination-process", true],
              [1, 1, "process.process-push", true],
              [1, 1, "process.process-production", true],
              [1, 1, "process.weight-measurement", true],
              [1, 1, "process.process-rewind", true],
              [1, 1, "process.lot-history", true],
              [1, 1, "inspection.receipt-inspection", true],
              [1, 1, "inspection.qc-inspection", true],
              [1, 1, "inspection.first-middle-last-inspection", true],
              [1, 1, "inspection.final-inspection", true],
              [1, 1, "shipment.shipping-plan", true],
              [1, 1, "shipment.shipping-register", true],
              [1, 1, "shipment.shipping-history", true],
              [1, 1, "document.production-instruction-report", true],
              [1, 1, "document.scrap-status", true],
              [1, 1, "document.good-scrap-status", true],
              [1, 1, "document.production-loss-status", true],
              [1, 1, "document.quarterly-production-status", true],
              [1, 1, "document.equipment-input-material-status", true],
              [1, 1, "document.group-production-status", true],
              [1, 1, "document.group-loss-status", true],
              [1, 1, "document.rewind-status", true],
              [1, 1, "document.equipment-production-personnel-status", true],
              [1, 1, "document.purchase-status", true]
            ];

            db.userGroupPermission.insertRangePrepare(employeePermission.map(item => ({
              companyId: item[0],
              userGroupId: item[1],
              code: item[2],
              valueJson: JSON.stringify(item[3])
            })));

            await db.executePreparedAsync();

            db.employee.insertRangePrepare([
              {
                id: 1,
                companyId: 1,
                userId: "master",
                name: "관리자",
                groupId: 1,
                code: "11111",
                encryptedPassword: String(new Md5().appendStr("1234").end()),
                isDisabled: false
              },
              {
                id: 2,
                companyId: 1,
                userId: "user",
                name: "사용자",
                groupId: 1,
                code: "22222",
                encryptedPassword: String(new Md5().appendStr("1234").end()),
                isDisabled: false
              }
            ]);

            db.auth.insertRangePrepare([{
              id: 1,
              employeeId: 1,
              createdAtDateTime: new DateTime()
            }]);

            db.partner.insertRangePrepare([
              {
                id: 1,
                companyId: 1,
                name: "거래처01",
                type: "매출처",
                isDisabled: false,
                erpSyncCode: 9999
              },
              {
                id: 2,
                companyId: 1,
                name: "거래처02",
                type: "매출처",
                isDisabled: false,
                erpSyncCode: 99999
              }
            ]);

            db.baseType.insertRangePrepare([
              // {
              //   id: 1,
              //   companyId: 1,
              //   type: "단위정보",
              //   name: "KG",
              //   isDisabled: false
              // },
              // {
              //   id: 2,
              //   companyId: 1,
              //   type: "단위정보",
              //   name: "EA",
              //   isDisabled: false
              // },
              // {
              //   id: 3,
              //   companyId: 1,
              //   type: "단위정보",
              //   name: "M",
              //   isDisabled: false
              // },
              {
                id: 4,
                companyId: 1,
                type: "품질 검사항목",
                name: "검사항목01",
                isDisabled: false
              },
              {
                id: 5,
                companyId: 1,
                type: "품질 검사항목",
                name: "검사항목02",
                isDisabled: false
              },
              {
                id: 6,
                companyId: 1,
                type: "품질 검사항목",
                name: "검사항목03",
                isDisabled: false
              },
              {
                id: 7,
                companyId: 1,
                type: "배차정보",
                name: "배차정보01",
                isDisabled: false
              },
              {
                id: 8,
                companyId: 1,
                type: "입고구분",
                name: "일반",
                isDisabled: false
              },
              {
                id: 9,
                companyId: 1,
                type: "입고구분",
                name: "기타입고",
                isDisabled: false
              },
              {
                id: 10,
                companyId: 1,
                type: "창고명칭",
                name: "일반",
                isDisabled: false
              },
              {
                id: 11,
                companyId: 1,
                type: "창고명칭",
                name: "외주",
                isDisabled: false
              },
              {
                id: 12,
                companyId: 1,
                type: "스크랩유형",
                name: "외관",
                isDisabled: false
              },
              {
                id: 13,
                companyId: 1,
                type: "스크랩유형",
                name: "알갱이",
                isDisabled: false
              },
              {
                id: 14,
                companyId: 1,
                type: "스크랩유형",
                name: "기타스크랩",
                isDisabled: false
              }
            ]);

            db.goods.insertRangePrepare([
              {
                id: 1,
                companyId: 1,
                name: "1010-23",
                specification: "1200",
                type: "제품",
                category: "PO(DS)",
                thick: 32,
                unitName: "M",
                unitPrice: 10000,
                length: 1000,
                isDisabled: false,
                adequateStock: 1000,
                createdAtDateTime: new DateTime(),
                createdByEmployeeId: 1,
                erpSyncCode: 9999
              },
              {
                id: 2,
                companyId: 1,
                name: "1010-23",
                specification: "1500",
                type: "제품",
                category: "PO(DS)",
                unitName: "M",
                unitId: 3,
                isDisabled: false,
                createdAtDateTime: new DateTime(),
                createdByEmployeeId: 1,
                erpSyncCode: 9998
              },
              {
                id: 3,
                companyId: 1,
                name: "제품01",
                specification: "SAMPLE",
                type: "제품",
                category: "카테고리2",
                unitId: 3,
                isDisabled: false,
                createdAtDateTime: new DateTime(),
                createdByEmployeeId: 1,
                erpSyncCode: 9997
              },
              {
                id: 4,
                companyId: 1,
                name: "재단01",
                specification: "100 * 50",
                type: "재단",
                unitName: "M",
                unitId: 3,
                isDisabled: false,
                createdAtDateTime: new DateTime(),
                createdByEmployeeId: 1,
                erpSyncCode: 9996
              },
              {
                id: 5,
                companyId: 1,
                name: "스크랩01",
                specification: "스크랩",
                type: "스크랩",
                unitName: "KG",
                unitId: 1,
                isDisabled: false,
                createdAtDateTime: new DateTime(),
                createdByEmployeeId: 1,
                erpSyncCode: 9995
              },
              {
                id: 6,
                companyId: 1,
                name: "자재01",
                specification: "자재규격01",
                type: "원재료",
                unitName: "KG",
                unitId: 1,
                isDisabled: false,
                adequateStock: 100,
                createdAtDateTime: new DateTime(),
                createdByEmployeeId: 1,
                erpSyncCode: 9994
              },
              {
                id: 7,
                companyId: 1,
                name: "자재02",
                specification: "자재규격02",
                type: "원재료",
                unitName: "KG",
                unitId: 1,
                isDisabled: false,
                adequateStock: 100,
                createdAtDateTime: new DateTime(),
                createdByEmployeeId: 1,
                erpSyncCode: 9993
              }
            ]);

            db.productionInfo.insertRangePrepare([
              {
                id: 1,
                companyId: 1,
                bothSides: true,
                goodId: 1,
                isDisabled: false,
                createdByEmployeeId: 1,
                createdAtDateTime: new DateTime()
              }
            ]);

            db.goodsInspection.insertRangePrepare([
              {
                id: 1,
                companyId: 1,
                goodsId: 1,
                productionInfoId: 1,
                inspectionId: 4,
                isUsingChart: true,
                createdByEmployeeId: 1,
                createdAtDateTime: new DateTime()
              },
              {
                id: 2,
                companyId: 1,
                productionInfoId: 1,
                goodsId: 1,
                inspectionId: 6,
                isUsingChart: false,
                createdByEmployeeId: 1,
                createdAtDateTime: new DateTime()
              }
            ]);

            db.goodsBuild.insertRangePrepare([
              {
                id: 1,
                companyId: 1,
                goodId: 1,
                createdByEmployeeId: 1,
                createdAtDateTime: new DateTime(),
                isDisabled: false
              }
            ]);

            db.goodsBuildList.insertRangePrepare([
              {
                id: 1,
                companyId: 1,
                bomId: 1,
                goodId: 1,
                seq: 1,
                name: "제품01 BOM_01",
                createdAtDateTime: new DateTime(),
                totalWeight: 20,
                createdByEmployeeId: 1,
                isStander: true,
                isDisabled: false
              },
              {
                id: 2,
                companyId: 1,
                bomId: 1,
                goodId: 1,
                seq: 2,
                totalWeight: 0,
                name: "제품01 BOM_02",
                createdAtDateTime: new DateTime(),
                createdByEmployeeId: 1,
                isStander: false,
                isDisabled: false
              }
            ]);

            db.goodsBuildGoods.insertRangePrepare([
              {
                id: 1,
                companyId: 1,
                bomListId: 1,
                type: "외층",
                typeSeq: 1,
                goodsId: 6,
                totalWeight: 10,
                mixPercent: 5,
                weight: 10,
                createdByEmployeeId: 1,
                createdAtDateTime: new DateTime()
              },
              {
                id: 2,
                companyId: 1,
                bomListId: 1,
                type: "내층",
                typeSeq: 1,
                goodsId: 7,
                totalWeight: 10,
                mixPercent: 5,
                weight: 10,
                createdByEmployeeId: 1,
                createdAtDateTime: new DateTime()
              }
            ]);

            db.equipment.insertRangePrepare([
              {
                id: 1,
                companyId: 1,
                name: "설비01",
                code: "AA",
                seq: 1,
                isCount: true,
                isDisabled: false,
                createdAtDateTime: new DateTime(),
                createdByEmployeeId: 1,
                equipmentCode: "T001",
                erpSyncCode: 99
              },
              {
                id: 2,
                companyId: 1,
                name: "설비0",
                code: "BB",
                seq: 2,
                isCount: true,
                isDisabled: false,
                createdAtDateTime: new DateTime(),
                createdByEmployeeId: 1,
                equipmentCode: "T002",
                erpSyncCode: 98
              }
            ]);

            db.equipmentByGoods.insertRangePrepare([
              {
                id: 1,
                companyId: 1,
                productionInfoId: 1,
                seq: 1,
                goodId: 1,
                equipmentId: 2,
                quantity: 1,
                leadTime: 1
              },
              {
                id: 2,
                companyId: 1,
                productionInfoId: 1,
                seq: 2,
                goodId: 1,
                equipmentId: 1,
                quantity: 1,
                leadTime: 2
              }
            ]);

            db.repairByEquipment.insertRangePrepare([
              {
                id: 1,
                companyId: 1,
                equipmentId: 1,
                dueDate: new DateOnly(),
                remark: "수리이력01",
                result: "수리완료",
                price: "100,000",
                createdAtDateTime: new DateTime(),
                createdByEmployeeId: 1
              }
            ]);

            db.warehouse.insertRangePrepare([
              {
                id: 1,
                companyId: 1,
                typeId: 10,
                name: "생산창고",
                rating: "A",
                isDisabled: false
              },
              {
                id: 2,
                companyId: 1,
                typeId: 10,
                name: "적재창고",
                rating: "B",
                isDisabled: false
              },
              {
                id: 3,
                companyId: 1,
                typeId: 10,
                name: "입고창고",
                rating: "공통",
                isDisabled: false
              },
              {
                id: 4,
                companyId: 1,
                typeId: 11,
                name: "외주창고01",
                rating: "공통",
                isDisabled: false
              }
            ]);

            db.lotHistory.insertRangePrepare([
              {
                id: 1,
                companyId: 1,
                warehouseId: 3,
                lot: "R" + new DateOnly().toFormatString("yyyyMMdd") + "01-01",
                printLot: "R" + new DateOnly().toFormatString("yyyyMMdd") + "01-01",
                seq: 1,
                goodId: 7,
                createdByEmployeeId: 1,
                createdAtDateTime: new DateTime(),
                isTesting: false,
                isNotStock: false
              },
              {
                id: 2,
                companyId: 1,
                warehouseId: 3,
                lot: "R" + new DateOnly().toFormatString("yyyyMMdd") + "02-01",
                printLot: "R" + new DateOnly().toFormatString("yyyyMMdd") + "02-01",
                seq: 1,
                goodId: 6,
                createdByEmployeeId: 1,
                createdAtDateTime: new DateTime(),
                isTesting: false,
                isNotStock: false
              },
              {
                id: 3,
                companyId: 1,
                warehouseId: 3,
                lot: "R" + new DateOnly().toFormatString("yyyyMMdd") + "03-01",
                printLot: "R" + new DateOnly().toFormatString("yyyyMMdd") + "03-01",
                seq: 1,
                goodId: 1,
                length: 1000,
                weight: 50,
                thick: 30,
                createdByEmployeeId: 1,
                createdAtDateTime: new DateTime(),
                isTesting: false,
                isNotStock: false
              }
            ]);

            db.goodsReceipt.insertRangePrepare([
              {
                id: 1,
                companyId: 1,
                code: "R" + new DateOnly().toFormatString("yyyyMMdd") + "01",
                dueDate: new DateTime(),
                partnerId: 2,
                goodId: 7,
                unitWeight: undefined,
                quantity: 500,
                unitPrice: 100,
                typeId: 8,
                remark: "일반입고",
                warehouseId: 3,
                receiptLotId: 1,
                isDisabled: false,
                needCanceled: false,
                createdByEmployeeId: 1,
                createdAtDateTime: new DateTime()
              },
              {
                id: 2,
                companyId: 1,
                code: "R" + new DateOnly().toFormatString("yyyyMMdd") + "02",
                dueDate: new DateTime(),
                partnerId: 1,
                goodId: 6,
                quantity: 1000,
                unitPrice: undefined,
                typeId: 8,
                remark: "일반입고",
                warehouseId: 3,
                receiptLotId: 2,
                isDisabled: false,
                needCanceled: false,
                createdByEmployeeId: 1,
                createdAtDateTime: new DateTime()
              },
              {
                id: 3,
                companyId: 1,
                code: "R" + new DateOnly().toFormatString("yyyyMMdd") + "03",
                dueDate: new DateTime(),
                partnerId: 1,
                goodId: 1,
                quantity: 1000,
                unitPrice: 1000,
                typeId: 8,
                remark: "일반입고",
                warehouseId: 3,
                receiptLotId: 3,
                isDisabled: false,
                needCanceled: false,
                createdByEmployeeId: 1,
                createdAtDateTime: new DateTime()
              }
            ]);

            db.stock.insertRangePrepare([
              {
                id: 1,
                companyId: 1,
                warehouseId: 3,
                lotId: 1,
                goodsId: 7,
                quantity: 500,
                rating: "공통",
                stockDate: new DateTime()
              },
              {
                id: 2,
                companyId: 1,
                warehouseId: 3,
                lotId: 2,
                goodsId: 6,
                quantity: 1000,
                rating: "공통",
                stockDate: new DateTime()
              },
              {
                id: 3,
                companyId: 1,
                warehouseId: 3,
                lotId: 3,
                goodsId: 1,
                quantity: 1000,
                rating: "공통",
                stockDate: new DateTime()
              }
            ]);

            db.availableStock.insertRangePrepare([
              {
                id: 1,
                companyId: 1,
                goodId: 6,
                quantity: 1000
              },
              {
                id: 2,
                companyId: 1,
                goodId: 7,
                quantity: 500
              },
              {
                id: 3,
                companyId: 1,
                goodId: 1,
                quantity: 0
              }
            ]);

            db.goodsIssuePlan.insertRangePrepare([
              {
                id: 1,
                companyId: 1,
                planYear: 2019,
                planMonth: 4,
                planDay: 20,
                week: 3,
                planDate: new DateOnly(2019, 4, 20),
                type: "내수용",
                planType: "확정",
                partnerId: 1,
                goodId: 1,
                planQuantity: 10000,
                stockQuantity: undefined,
                productionQuantity: 10000,
                allocateTypeId: undefined,
                createdByEmployeeId: 1,
                createdAtDateTime: new DateTime(),
                isDisabled: false,
                isClosed: false
              }
            ]);

            db.goodsIssuePlanItem.insertRangePrepare([
              {
                id: 1,
                companyId: 1,
                goodsIssuePlanId: 1,
                goodsId: 1,
                lotId: 3,
                warehouseId: 3,
                quantity: 10,
                createdByEmployeeId: 1,
                createdAtDateTime: new DateTime(),
                isDisabled: false
              }
            ]);

            db.productionInstruction.insertRangePrepare([
              {
                id: 1,
                companyId: 1,
                shippingPlanId: 1,
                productionInstructionCode: "A" + new DateOnly().toFormatString("yyyyMMdd") + "01",
                orderDate: new DateOnly(),
                goodId: 1,
                equipmentId: 2,
                bomId: 1,
                rollLength: 1000,
                productQuantity: 90,
                productWeight: 54,
                rollWeight: 56,
                partnerId: 1,
                capa: 1,
                corona: "양면",
                createdAtDateTime: new DateTime(),
                createdByEmployeeId: 1,
                isCanceled: false
              }
            ]);
            /!*            db.lotHistory.insertRangePrepare([
                  {
                    id: 1,
                    companyId: 1,
                    lot: "2019012101-03",
                    goodId: 1,
                    createdByEmployeeId: 1,
                    createdAtDateTime: new DateTime()
                  },
                  {
                    id: 2,
                    companyId: 1,
                    lot: "S2019012101-02",
                    goodId: 1,
                    createdByEmployeeId: 1,
                    createdAtDateTime: new DateTime()
                  },
                  {
                    id: 3,
                    companyId: 1,
                    lot: "S2019012101-03",
                    goodId: 1,
                    createdByEmployeeId: 1,
                    createdAtDateTime: new DateTime()
                  },
                  {
                    id: 4,
                    companyId: 1,
                    lot: "RP20190121-01",
                    goodId: 1,
                    createdAtDateTime: new DateTime(),
                    createdByEmployeeId: 1
                  },
                  {
                    id: 5,
                    companyId: 1,
                    lot: "R20190121-01",
                    goodId: 1,
                    createdAtDateTime: new DateTime(),
                    createdByEmployeeId: 1
                  },
                  {
                    id: 6,
                    companyId: 1,
                    lot: "B201901300101",
                    goodId: 4,
                    createdAtDateTime: new DateTime(),
                    createdByEmployeeId: 1
                  },
                  {
                    id: 7,
                    companyId: 1,
                    lot: "B201901300102",
                    goodId: 2,
                    createdAtDateTime: new DateTime(),
                    createdByEmployeeId: 1
                  },
                  {
                    id: 8,
                    companyId: 1,
                    lot: "S2019012101-04",
                    goodId: 1,
                    createdByEmployeeId: 1,
                    createdAtDateTime: new DateTime()
                  },
                  {
                    id: 9,
                    companyId: 1,
                    lot: "S2019012101-05",
                    goodId: 1,
                    createdByEmployeeId: 1,
                    createdAtDateTime: new DateTime()
                  },
                  {
                    id: 10,
                    companyId: 1,
                    lot: "S2019012101-06",
                    goodId: 1,
                    createdByEmployeeId: 1,
                    createdAtDateTime: new DateTime()
                  },
                ]);

                db.goodsReceipt.insertRangePrepare([
                  {
                    id: 1,
                    companyId: 1,
                    dueDate: new DateOnly(),
                    partnerId: 1,
                    goodId: 1,
                    unitWeight: 10,
                    quantity: 10,
                    unitPrice: 1000,
                    type: "일반",
                    remark: "일반입고",
                    warehouseId: 3,
                    receiptLotId: 4,
                    isDisabled: false,
                    createdByEmployeeId: 1,
                    createdAtDateTime: new DateTime()
                  },
                  {
                    id: 2,
                    companyId: 1,
                    dueDate: new DateOnly(),
                    partnerId: 2,
                    goodId: 4,
                    quantity: 100,
                    unitPrice: 1000,
                    type: "일반",
                    remark: "일반입고",
                    warehouseId: 3,
                    receiptLotId: 6,
                    isDisabled: false,
                    createdByEmployeeId: 1,
                    createdAtDateTime: new DateTime()
                  },
                  {
                    id: 3,
                    companyId: 1,
                    dueDate: new DateOnly(),
                    partnerId: 2,
                    goodId: 2,
                    quantity: 200,
                    unitPrice: 100,
                    type: "일반",
                    remark: "일반입고",
                    warehouseId: 3,
                    receiptLotId: 7,
                    isDisabled: false,
                    createdByEmployeeId: 1,
                    createdAtDateTime: new DateTime()
                  }
                ]);

                db.stockTransfer.insertRangePrepare([
                  {
                    id: 1,
                    companyId: 1,
                    dueDate: new DateOnly(),
                    lotId: 4,
                    goodsId: 1,
                    fromWarehouseId: 3,
                    toWarehouseId: 1,
                    quantity: 10,
                    remark: "재고이동",
                    createdAtDateTime: new DateTime(),
                    createdByEmployeeId: 1
                  }
                ]);

                db.stockAdjustment.insertRangePrepare([
                  {
                    id: 1,
                    companyId: 1,
                    dueDate: new DateOnly(),
                    lotId: 4,
                    goodsId: 1,
                    warehouseId: 1,
                    fromQuantity: 10,
                    toQuantity: 20,
                    remark: "재고조정",
                    createdAtDateTime: new DateTime(),
                    createdByEmployeeId: 1
                  }
                ]);

                db.packing.insertRangePrepare([
                  {
                    id: 1,
                    companyId: 1,
                    paletteBarcode: "PB20190121-01",
                    createdAtDateTime: new DateTime(),
                    createdByEmployeeId: 1,
                    isDisabled: false
                  }
                ]);

                db.packingItem.insertRangePrepare([
                  {
                    id: 1,
                    companyId: 1,
                    packingId: 1,
                    seq: 1,
                    lotId: 1,
                    goodId: 1,
                    isDisabled: false,
                    createdByEmployeeId: 1,
                    createdAtDateTime: new DateTime()
                  },
                  {
                    id: 2,
                    companyId: 1,
                    packingId: 1,
                    seq: 2,
                    lotId: 2,
                    goodId: 1,
                    isDisabled: false,
                    createdByEmployeeId: 1,
                    createdAtDateTime: new DateTime()
                  }
                ]);

                db.stock.insertRangePrepare([
                  {
                    id: 1,
                    companyId: 1,
                    warehouseId: 1,
                    paletteBarcodeId: 1,
                    lotId: 1,
                    goodsId: 1,
                    quantity: 100,
                    rating: "A"
                  },
                  {
                    id: 2,
                    companyId: 1,
                    warehouseId: 1,
                    paletteBarcodeId: 1,
                    lotId: 2,
                    goodsId: 1,
                    quantity: 50,
                    rating: "A"
                  },
                  {
                    id: 3,
                    companyId: 1,
                    warehouseId: 3,
                    lotId: 6,
                    goodsId: 4,
                    quantity: 100,
                    rating: "공통"
                  },
                  {
                    id: 4,
                    companyId: 1,
                    warehouseId: 1,
                    lotId: 4,
                    goodsId: 1,
                    quantity: 20,
                    rating: "공통"
                  },
                  {
                    id: 5,
                    companyId: 1,
                    warehouseId: 1,
                    lotId: 7,
                    goodsId: 2,
                    quantity: 200,
                    rating: "공통"
                  }
                ]);

                db.availableStock.insertRangePrepare([
                  {
                    id: 1,
                    companyId: 1,
                    goodId: 1,
                    quantity: 150
                  }
                ]);

                db.goodsIssuePlan.insertRangePrepare([
                  {
                    id: 1,
                    companyId: 1,
                    planYear: 2019,
                    planMonth: 1,
                    week: 2,
                    type: "내수용",
                    partnerId: 1,
                    goodId: 1,
                    planQuantity: 100,
                    stockQuantity: 90,
                    productionQuantity: 10,
                    allocateTypeId: 7,
                    createdByEmployeeId: 1,
                    createdAtDateTime: new DateTime(),
                    isDisabled: false,
                    isClosed: false
                  }
                ]);

                db.goodsIssuePlanItem.insertRangePrepare([
                  {
                    id: 1,
                    companyId: 1,
                    goodsIssuePlanId: 1,
                    goodsId: 1,
                    lotId: 1,
                    warehouseId: 1,
                    quantity: 80,
                    createdByEmployeeId: 1,
                    createdAtDateTime: new DateTime(),
                    isDisabled: false
                  },
                  {
                    id: 2,
                    companyId: 1,
                    goodsIssuePlanId: 1,
                    goodsId: 1,
                    lotId: 2,
                    warehouseId: 1,
                    quantity: 10,
                    createdByEmployeeId: 1,
                    createdAtDateTime: new DateTime(),
                    isDisabled: false
                  }
                ]);

                db.productionInstruction.insertRangePrepare([
                  {
                    id: 1,
                    companyId: 1,
                    shippingPlanId: 1,
                    productionInstructionCode: "S2019012101",
                    orderDate: new DateOnly(),
                    goodId: 1,
                    equipmentId: 1,
                    bomId: 1,
                    rollLength: 1000,
                    corona: "양면",
                    productQuantity: 10,
                    createdAtDateTime: new DateTime(),
                    createdByEmployeeId: 1,
                    isCanceled: false
                  }
                ]);

                db.production.insertRangePrepare([
                  {
                    id: 1,
                    companyId: 1,
                    instructionId: 1,
                    goodId: 1,
                    equipmentId: 1,
                    orderQuantity: 10,
                    status: "생산중",
                    inspectionId: undefined,
                    createdByEmployeeId: 1,
                    createdAtDateTime: new DateTime(),
                    isCanceled: false
                  }
                ]);

                db.productionItem.insertRangePrepare([
                  {
                    id: 1,
                    companyId: 1,
                    productionId: 1,
                    goodId: 1,
                    lotId: 1,
                    weight: 60,
                    length: 1000,
                    width: 1500,
                    outSide: 50,
                    inside: 50,
                    theMinimum: 20,
                    theBest: 30,
                    average: 25,
                    md: undefined,
                    td: undefined,
                    rating: "A",
                    createdAtDateTime: new DateTime(),
                    createdByEmployeeId: 1
                  },
                  {
                    id: 2,
                    companyId: 1,
                    productionId: 1,
                    goodId: 1,
                    lotId: 2,
                    weight: 60,
                    length: 1000,
                    width: 1500,
                    outSide: 50,
                    inside: 50,
                    theMinimum: 20,
                    theBest: 30,
                    average: 25,
                    md: undefined,
                    td: undefined,
                    rating: undefined,
                    createdAtDateTime: new DateTime(),
                    createdByEmployeeId: 1
                  },
                  {
                    id: 3,
                    companyId: 1,
                    productionId: 1,
                    goodId: 1,
                    lotId: 8,
                    weight: 60,
                    length: 1000,
                    width: 1500,
                    outSide: 50,
                    inside: 50,
                    theMinimum: 20,
                    theBest: 30,
                    average: 25,
                    md: undefined,
                    td: undefined,
                    rating: undefined,
                    createdAtDateTime: new DateTime(),
                    createdByEmployeeId: 1
                  },
                  {
                    id: 4,
                    companyId: 1,
                    productionId: 1,
                    goodId: 1,
                    lotId: 9,
                    weight: 60,
                    length: 1000,
                    width: 1500,
                    outSide: 50,
                    inside: 50,
                    theMinimum: 20,
                    theBest: 30,
                    average: 25,
                    md: undefined,
                    td: undefined,
                    rating: undefined,
                    createdAtDateTime: new DateTime(),
                    createdByEmployeeId: 1
                  },
                  {
                    id: 5,
                    companyId: 1,
                    productionId: 1,
                    goodId: 1,
                    lotId: 10,
                    weight: 60,
                    length: 1000,
                    width: 1500,
                    outSide: 50,
                    inside: 50,
                    theMinimum: 20,
                    theBest: 30,
                    average: 25,
                    md: undefined,
                    td: undefined,
                    rating: undefined,
                    createdAtDateTime: new DateTime(),
                    createdByEmployeeId: 1
                  }
                ]);

                db.lotTransfer.insertRangePrepare([
                  {
                    id: 1,
                    companyId: 1,
                    fromLotId: 1,
                    toLotId: 3,
                    goodId: 1,
                    remark: "기타변경",
                    createdAtDateTime: new DateTime(),
                    createdByEmployeeId: 1,
                    isCanceled: false
                  }
                ]);*!/

            await db.executePreparedAsync();
          }*/
        },
        true
      );
    }

    const authId = localStorageProvider.get("authId");
    if (authId) {
      await ormProvider.connectAsync(MainDbContext, async db => {
        appDataProvider.authInfo = await AuthProc.loginAsync(db, authId);
      });
    }
  }
}
