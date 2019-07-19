import {sorm} from "@simplism/orm-query";
import {DateTime} from "@simplism/core";
import {MainDbContext} from "../MainDbContext";
import {SdSocketProvider} from "@simplism/angular";

export class MySqlProc {
  public static async syncEmployees(db: MainDbContext, socket: SdSocketProvider): Promise<void> {

    const lastModifyDate = await db.erpSync
      .where(item =>
        [sorm.equal(item.code, "Employee")]
      )
      .select(item => ({
        syncDate: item.syncDate
      }))
      .singleAsync();

    const employeeList = await socket.sendAsync("ErpMysqlQueryService.executeQueryAsync", [`
        SELECT
  TBL.m_idx AS id,
  TBL.m_id AS userId,
  TBL.m_pw AS password,
  TBL.m_name AS name,
  TBL.m_sex AS sex,
  TBL.m_email AS emailAddress,
  TBL.m_mobile AS phoneNumber,
  TBL.m_addr1 AS addr1,
  TBL.m_addr2 AS addr2,
  TBL.m_block AS isDisabled,
  TBL.m_lastmodify_date AS lastModifyDate,
  TBL.m_position AS position,
  department.title AS department
FROM breed_member AS TBL
  LEFT OUTER JOIN newgratech.breed_organization AS department
ON (department.cateno= TBL.m_organization)
WHERE IFNULL(TBL.m_lastmodify_date, NOW()) > '${lastModifyDate!.syncDate.toFormatString("yyyy-MM-dd hh:mm:ss")}'
OR IFNULL(TBL.m_join_date, NOW()) > '${lastModifyDate!.syncDate.toFormatString("yyyy-MM-dd hh:mm:ss")}'`.trim()]);

    const mesEmployeeList = await db.employee.select(item => ({id: item.id, syncCode: item.code})).resultAsync();

    for (const updateItem of employeeList) {
      if (mesEmployeeList.some(item => item.syncCode === String(updateItem.id))) {
        db.employee
          .where(item => [
            sorm.equal(item.code, updateItem.id)
          ])
          .updatePrepare(() => ({
            companyId: 1,
            code: updateItem.id,
            name: updateItem.name,
            encryptedPassword: updateItem.password,
            department: updateItem.department,
            position: updateItem.position,
            sex: sorm.cast(updateItem.sex, Number),
            emailAddress: updateItem.email,
            phoneNumber: updateItem.phoneNumber,
            isDisabled: sorm.cast(updateItem.isDisabled, Boolean)
          }));
      }
      else {
        db.employee.insertPrepare({
          companyId: 1,
          code: updateItem.id,
          userId: updateItem.userId,
          name: updateItem.name,
          encryptedPassword: updateItem.password,
          department: updateItem.department,
          position: updateItem.position,
          sex: updateItem.sex,
          emailAddress: updateItem.emailAddress,
          phoneNumber: updateItem.phoneNumber,
          isDisabled: updateItem.isDisabled
        });

      }
    }
    await db.executePreparedAsync();

    await db.erpSync
      .where(item =>
        [sorm.equal(item.code, "Employee")]
      )
      .updateAsync(item => ({
        syncDate: new DateTime()
      }));
  }

  public static async syncPartner(db: MainDbContext, socket: SdSocketProvider): Promise<void> {
    const lastModifyDate = await db.erpSync
      .where(item =>
        [sorm.equal(item.code, "Partner")]
      )
      .select(item => ({
        syncDate: item.syncDate
      }))
      .singleAsync();

    const partnerList = await socket.sendAsync("ErpMysqlQueryService.executeQueryAsync", [`
 SELECT
  TBL.customer_idx AS id,
  TBL.customer_company_type AS companyType,
  TBL.customer_name AS name,
  TBL.customer_code AS partnerCode,
  TBL.customer_ceo AS representative,
  TBL.customer_number AS registrationNumber,
  TBL.customer_corporate_number AS businessRegistrationNumber,
  TBL.customer_tel AS tel,
  TBL.customer_mobile AS phoneNumber,
  TBL.customer_fax AS faxNumber,
  TBL.customer_email AS emailAddress,
  TBL.customer_homepage AS homePage,
  TBL.customer_business_type AS businessConditions,
  TBL.customer_business_item AS event,
  TBL.customer_addr1 AS address,
  TBL.customer_addr2 AS addressDetail,
  TBL.customer_zip AS postcode,
  TBL.customer_buy_type AS type,
  TBL.is_export AS isExport,
  TBL.is_customer_delete AS isDisabled,
  TBL.customer_modifydate AS lastModifyDate
FROM breed_customer AS TBL
 WHERE IFNULL(TBL.customer_modifydate, NOW()) > '${lastModifyDate!.syncDate.toFormatString("yyyy-MM-dd hh:mm:ss")}'
 OR IFNULL(TBL.customer_regdate, NOW()) > '${lastModifyDate!.syncDate.toFormatString("yyyy-MM-dd hh:mm:ss")}'`.trim()]);

    const mesPartnerList = await db.partner.select(item => ({id: item.id, syncCode: item.erpSyncCode})).resultAsync();

    for (const updateItem of partnerList) {
      if (mesPartnerList.some(item => item.syncCode === updateItem.id)) {
        db.partner
          .where(item => [
            sorm.equal(item.erpSyncCode, updateItem.id)
          ])
          .updatePrepare(() => ({
            companyType: updateItem.companyType === 1 ? "법인" : "개인",
            name: updateItem.name,
            partnerCode: updateItem.partnerCode,
            representative: updateItem.representative,
            registrationNumber: updateItem.registrationNumber,
            businessRegistrationNumber: updateItem.businessRegistrationNumber,
            tel: updateItem.tel,
            phoneNumber: updateItem.phoneNumber,
            faxNumber: updateItem.faxNumber,
            emailAddress: updateItem.emailAddress,
            homePage: updateItem.homePage,
            businessConditions: updateItem.businessConditions,
            event: updateItem.event,
            address: updateItem.address,
            addressDetail: updateItem.addressDetail,
            postcode: updateItem.postcode,
            type: updateItem.type === 1 ? "매출처" : updateItem.type === 2 ? "매입처" : "본사",
            isExport: updateItem.isExport === "1",
            isDisabled: updateItem.isDisabled === 1
          }));
      }
      else {
        db.partner.insertPrepare({
          companyId: 1,
          erpSyncCode: updateItem.id,
          companyType: updateItem.companyType === 1 ? "법인" : "개인",
          name: updateItem.name,
          partnerCode: updateItem.partnerCode,
          representative: updateItem.representative,
          registrationNumber: updateItem.registrationNumber,
          businessRegistrationNumber: updateItem.businessRegistrationNumber,
          tel: updateItem.tel,
          phoneNumber: updateItem.phoneNumber,
          faxNumber: updateItem.faxNumber,
          emailAddress: updateItem.emailAddress,
          homePage: updateItem.homePage,
          businessConditions: updateItem.businessConditions,
          event: updateItem.event,
          address: updateItem.address,
          addressDetail: updateItem.addressDetail,
          postcode: updateItem.postcode,
          type: updateItem.type === 1 ? "매출처" : updateItem.type === 2 ? "매입처" : "본사",
          isExport: updateItem.isExport === "1",
          isDisabled: updateItem.isDisabled === 1
        });
      }

    }
    await db.executePreparedAsync();

    await db.erpSync
      .where(item =>
        [sorm.equal(item.code, "Partner")]
      )
      .updateAsync(item => ({
        syncDate: new DateTime()
      }));
  }

  public static async syncGoods(db: MainDbContext, socket: SdSocketProvider): Promise<void> {
    const lastModifyDate = await db.erpSync
      .where(item =>
        [sorm.equal(item.code, "Goods")]
      )
      .select(item => ({
        syncDate: item.syncDate
      }))
      .singleAsync();

    const goodsList = await socket.sendAsync("ErpMysqlQueryService.executeQueryAsync", [`
 SELECT TBL.sp_key              AS id,
       TBL.sp_name             AS name,
       CAST(TBL.sp_stand AS CHAR(255)) AS specification,
       TBL.sp_thick            AS thick,
       TBL.sp_weight           AS weight,
       TBL.sbu_name            AS unitName,
       TBL.sp_price            AS unitPrice,
       TBL.sp_int              AS stockQuantity,
       TBL.sp_loss             AS lossQuantity,
       TBL.sp_length           AS length,
       TBL.sp_stock            AS adequateStock,
       TBL.sp_stock_per        AS adequateStockRate,
       TBL.sp_text             AS remark,
       TBL.sp_use              AS isDisabled,
       TBL.mod_date            AS lastModifyDate,
       TBL.sp_date             AS standardDate,
       goodsType.sbpc_name     AS type,
       goodsCategory.sbpi_name AS category
FROM ss_product AS TBL
       LEFT OUTER JOIN newgratech.ss_basic_product_code AS goodsType ON (goodsType.sbpc_key = TBL.sbpc_key)
       LEFT OUTER JOIN newgratech.ss_basic_product_index AS goodsCategory ON (goodsCategory.sbpi_key = TBL.sbpi_key)
       WHERE IFNULL(TBL.mod_date, NOW()) > '${lastModifyDate!.syncDate.toFormatString("yyyy-MM-dd hh:mm:ss")}'
       OR IFNULL(TBL.reg_date, NOW()) > '${lastModifyDate!.syncDate.toFormatString("yyyy-MM-dd hh:mm:ss")}'
     ORDER BY goodsType.sbpc_name DESC, goodsCategory.sbpi_name ASC, TBL.sp_name ASC, TBL.sp_stand ASC`.trim()]);

    const mesGoodsList = await db.goods.select(item => ({id: item.id, syncCode: item.erpSyncCode})).resultAsync();

    for (const updateItem of goodsList) {
      if ((mesGoodsList.some(item => item.syncCode === updateItem.id))) {
        db.goods
          .where(item => [
            sorm.equal(item.erpSyncCode, updateItem.id)
          ])
          .updatePrepare(() => ({
            specification: sorm.cast(updateItem.specification, String),
            type: updateItem.type,
            category: updateItem.category,
            thick: updateItem.thick,
            weight: updateItem.weight,
            unitId: updateItem.unitId,
            unitName: updateItem.unitName,
            unitPrice: updateItem.unitPrice,
            stockQuantity: updateItem.stockQuantity,
            lossQuantity: updateItem.lossQuantity,
            length: updateItem.length,
            adequateStock: updateItem.adequateStock,
            adequateStockRate: updateItem.adequateStockRate,
            remark: updateItem.remark,
            createdAtDateTime: updateItem.standardDate,
            isDisabled: updateItem.isDisabled === 1
          }));
      }
      else {
        db.goods.insertPrepare({
          companyId: 1,
          erpSyncCode: updateItem.id,
          name: updateItem.name,
          specification: sorm.cast(updateItem.specification, String),
          type: updateItem.type,
          category: updateItem.category,
          thick: updateItem.thick,
          weight: updateItem.weight,
          unitId: updateItem.unitId,
          unitName: updateItem.unitName,
          unitPrice: updateItem.unitPrice,
          stockQuantity: updateItem.stockQuantity,
          lossQuantity: updateItem.lossQuantity,
          length: updateItem.length,
          adequateStock: updateItem.adequateStock,
          adequateStockRate: updateItem.adequateStockRate,
          createdAtDateTime: updateItem.standardDate,
          remark: updateItem.remark,
          isDisabled: updateItem.isDisabled === 1
        });
      }
    }
    await db.executePreparedAsync();

    await db.erpSync
      .where(item =>
        [sorm.equal(item.code, "Goods")]
      )
      .updateAsync(item => ({
        syncDate: new DateTime()
      }));
  }

  public static async syncEquipments(db: MainDbContext, socket: SdSocketProvider): Promise<void> {
    const lastModifyDate = await db.erpSync
      .where(item =>
        [sorm.equal(item.code, "Equipment")]
      )
      .select(item => ({
        syncDate: item.syncDate
      }))
      .singleAsync();

    const equipmentList = await socket.sendAsync("ErpMysqlQueryService.executeQueryAsync", [`
 SELECT TBL.sbma_key    AS id,
       TBL.sbma_name   AS name,
       TBL.sbma_order   AS seq,
       TBL.sbma_symbol AS code,
       TBL.reg_date    AS createDate,
       TBL.sbma_report    AS isCount
FROM ss_basic_machine AS TBL`.trim()]);

    for (const updateItem of equipmentList) {
      if ((await db.equipment.where(item => [sorm.equal(item.erpSyncCode, updateItem.id)]).countAsync()) > 0) {
        if (updateItem.lastModifyDate > lastModifyDate!.syncDate!) {
          await db.equipment
            .where(item => [
              sorm.equal(item.erpSyncCode, updateItem.id)
            ])
            .upsertAsync({
              seq: updateItem.seq,
              name: updateItem.name,
              code: updateItem.code,
              equipmentCode: await this._getEquipmentCode(updateItem.name),
              isCount: updateItem.isCount === "Y",
              isDisabled: updateItem.isCount !== "Y",
              createdAtDateTime: updateItem.createDate
            });
        }
      }
      else {
        await db.equipment.insertAsync({
          companyId: 1,
          seq: updateItem.seq,
          erpSyncCode: updateItem.id,
          name: updateItem.name,
          code: updateItem.code,
          equipmentCode: await this._getEquipmentCode(updateItem.name),
          isCount: updateItem.isCount === "Y",
          isDisabled: updateItem.isCount !== "Y",
          createdAtDateTime: updateItem.createDate
        });
      }
    }
    //TODO: erp에서 비가동 시간 가져와야 할 경우 추가
    /*
        const equipmentStopList = await socket.sendAsync("ErpMysqlQueryService.executeQueryAsync", [`
     SELECT TBL.sbma_key    AS id,
           TBL.sbma_name   AS name,
           TBL.sbma_order   AS seq,
           TBL.sbma_symbol AS code,
           TBL.reg_date    AS createDate,
           TBL.sbma_report    AS isCount
    FROM ss_off_time AS TBL`.trim()]);
    */
    await db.erpSync
      .where(item =>
        [sorm.equal(item.code, "Equipment")]
      )
      .updateAsync(item => ({
        syncDate: new DateTime()
      }));
  }

  public static async _getEquipmentCode(name: string): Promise<any> {
    if (name.includes("리와인더1호기")) {
      return "R001";
    }
    else if (name.includes("리와인더2호기")) {
      return "R002";
    }
    else if (name.includes("리와인더3호기")) {
      return "R003";
    }
    else if (name.includes("3호기")) {
      return "M003";
    }
    else if (name.includes("싱글호기")) {
      return "S001";
    }
    else if (name.includes("1호기")) {
      return "M001";
    }
    else if (name.includes("2호기")) {
      return "M002";
    }
  }
}