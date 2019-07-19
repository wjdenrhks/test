import {sorm} from "@simplism/orm-query";
import {DateOnly, DateTime} from "@simplism/core";
import {MainDbContext} from "../MainDbContext";

export class CodeProc {
  public static async getDocumentCode(db: MainDbContext, companyId: number, employeeId: number, goodId: number | undefined, date: DateOnly | undefined, type: string, equipmentId: number | undefined, equipmentCode: string | undefined): Promise<string> {

    let typeCode = "";
    let lastDocument: any;

    if (type === "생산") {
      if (equipmentCode === "X" || equipmentCode === "W" || equipmentCode === "V") {
        typeCode = "R";
      }
      else {
        typeCode = equipmentCode!;
      }

      /*  if (typeCode === ("V" || "W" || "X")) {
          lastDocument = (
            await db.rewindProcess
              .where(item => [
                sorm.equal(item.companyId, companyId),
                sorm.includes(item.code, firstCode)
              ])
              .orderBy(item => item.code, true)
              .top(1)
              .select(item => ({
                code: item.code
              }))
              .singleAsync()
          );
        }
        else {
          lastDocument = (
            await db.productionInstruction
              .where(item => [
                sorm.equal(item.companyId, companyId),
                sorm.includes(item.productionInstructionCode, firstCode)
              ])
              .orderBy(item => item.productionInstructionCode, true)
              .top(1)
              .select(item => ({
                code: item.productionInstructionCode
              }))
              .singleAsync()
          );
        }*/

      const firstCode = date!.toFormatString("yyyyMMdd");

      const rewindLastDocument = (
        await db.rewindProcess
          .where(item => [
            sorm.equal(item.companyId, companyId),
            sorm.includes(item.code, firstCode)
          ])
          .orderBy(item => item.code, true)
          .top(1)
          .select(item => ({
            code: item.code
          }))
          .singleAsync()
      );

      const productionLastDocument = (
        await db.productionInstruction
          .where(item => [
            sorm.equal(item.companyId, companyId),
            sorm.includes(item.productionInstructionCode, firstCode)
          ])
          .orderBy(item => item.seq, true)
          .top(1)
          .select(item => ({
            seq: item.seq
          }))
          .singleAsync()
      );
      const productionLastSeq = (rewindLastDocument ? Number.parseInt(rewindLastDocument!.code!.slice(-2), 10)! : 0)! > (productionLastDocument ? productionLastDocument.seq : 0)!
        ? (rewindLastDocument ? Number.parseInt(rewindLastDocument!.code!.slice(-2), 10)! : 0)! : (productionLastDocument ? productionLastDocument.seq : 0)!;
      return (typeCode + firstCode) + (productionLastSeq + 1).toString().padStart(2, "0");
    }
    else if (type === "입고") {
      typeCode = "B";
      const firstCode = new DateOnly().toFormatString("yyyy");

      lastDocument = (
        await db.goodsReceipt
          .where(item => [
            sorm.equal(item.companyId, companyId),
            sorm.includes(item.code, firstCode)
          ])
          .orderBy(item => item.codeSeq, true)
          .top(1)
          .select(item => ({
            seq: item.codeSeq
          }))
          .singleAsync()
      );

      const receiptLastSeq = lastDocument ? lastDocument.seq : 0;
      return (typeCode + firstCode) + (receiptLastSeq + 1).toString().padStart(5, "0");
    }
    else if (type === "출고") {
      typeCode = "S";
      const firstCode = new DateOnly().toFormatString("yyyy");

      lastDocument = (
        await db.goodsIssue
          .where(item => [
            sorm.equal(item.companyId, companyId),
            sorm.includes(item.code, firstCode)
          ])
          .orderBy(item => item.codeSeq, true)
          .top(1)
          .select(item => ({
            seq: item.codeSeq
          }))
          .singleAsync()
      );

      const shippingLastSeq = lastDocument ? lastDocument.seq : 0;
      return (typeCode + firstCode) + (shippingLastSeq + 1).toString().padStart(5, "0");
    }
    else if (type === "포장") {
      typeCode = "PB";

      const firstCode = new DateOnly().toFormatString("yyyy");
      lastDocument = (
        await db.packing
          .where(item => [
            sorm.equal(item.companyId, companyId),
            sorm.includes(item.paletteBarcode, firstCode)
          ])
          .orderBy(item => item.codeSeq, true)
          .top(1)
          .select(item => ({
            seq: item.codeSeq
          }))
          .singleAsync()
      );
      const shippingLastSeq = lastDocument ? lastDocument.seq : 0;
      return (typeCode + firstCode) + (shippingLastSeq + 1).toString().padStart(5, "0");
    }

    return "잘못 된 수식이 입력되었습니다.\n확인 후 다시 진행해 주세요.";
    /* else if (type === "산출") {
       typeCode = "P";

       lastDocument = (
         await db.pushProcessItem
           .include(item => item.lot)
           .where(item => [
             sorm.equal(item.companyId, companyId),
             sorm.includes(item.lot!.lot, typeCode + firstCode)
           ])
           .orderBy(item => item.lot!.lot, true)
           .top(1)
           .select(item => ({
             code: item.lot!.lot
           }))
           .singleAsync()
       );
     }

     }*/

  }

  public static async getLotCode2(db: MainDbContext, companyId: number, employeeId: number, warehouseId: number, goodId: number, goodName: string,
                                  equipmentCode: string, docDate?: DateOnly, length?: number, weight?: number, width?: string, thick?: number, productionId?: number, rewindId?: number): Promise<ILotInfo> {

    const date = docDate ? docDate.toFormatString("yyMMdd") : new DateOnly().toFormatString("yyMMdd");
    const code = equipmentCode + date;
    const reNameGood = goodName ? goodName.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/gi, "") : goodName;
    const reNameGoodStr = reNameGood.length < 6 ? reNameGood.padStart(6, "0") : reNameGood.length > 11 ? reNameGood.slice(0, 11) : reNameGood;
    const goodNameStr = goodName.length < 6 ? goodName.padStart(6, "0") : goodName.length > 11 ? goodName.slice(0, 11) : goodName;

    const lastInfo = (
      await db.lotHistory
        .where(item => [
          sorm.equal(item.companyId, companyId),
          sorm.includes(item.lot, code)
        ])
        .orderBy(item => item.lot, true)
        .top(1)
        .select(item => ({
          code: item.lot,
          seq: item.seq
        }))
        .singleAsync()
    );

    const lastSeq = lastInfo ? lastInfo.seq : 0;
    const lotCode = code + (lastSeq + 1).toString().padStart(3, "0") + goodNameStr;
    const lotPrintCode = code + (lastSeq + 1).toString().padStart(3, "0") + reNameGoodStr;

    //TODO: LOT명에 한글이 들어가야 할 경우 표시 LOT와 프린터 LOT별개 처리
    const lotInfo = await db.lotHistory
      .insertAsync({
        companyId,
        lot: lotPrintCode,
        seq: Number((lastSeq + 1).toString().padStart(3, "0")),
        printLot: lotPrintCode,
        productionId,
        rewindId,
        warehouseId,
        goodId,
        length,
        weight,
        width,
        thick,
        isTesting: false,
        isNotStock: false,
        createdAtDateTime: new DateTime(),
        createdByEmployeeId: employeeId
      });

    return {
      goodId,
      seq: Number((lastSeq + 1).toString().padStart(3, "0")),
      code: equipmentCode,
      lotId: lotInfo.id,
      lotName: lotCode,
      length: lotInfo.length,
      weight: lotInfo.weight
    };
  }


  public static async getTestLotCode(db: MainDbContext, companyId: number, employeeId: number, warehouseId: number, goodId: number, goodName: string,
                                     seq?: number, productionId?: number, rewindId?: number, docDate?: DateOnly): Promise<ILotInfo> {

    const date = docDate ? docDate.toFormatString("yyMMdd") : new DateOnly().toFormatString("yyMMdd");
    const code = "TT" + date;
    const reNameGood = goodName ? goodName.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/gi, "") : goodName;
    const reNameGoodStr = reNameGood.length < 6 ? reNameGood.padStart(6, "0") : reNameGood.length > 11 ? reNameGood.slice(0, 11) : reNameGood;
    const goodNameStr = goodName.length < 6 ? goodName.padStart(6, "0") : goodName.length > 11 ? goodName.slice(0, 11) : goodName;

    const lastInfo = (
      await db.lotHistory
        .where(item => [
          sorm.equal(item.companyId, companyId),
          sorm.equal(item.productionId, productionId),
          sorm.equal(item.seq, 0)
        ])
        .select(item => ({
          id: item.id
        }))
        .countAsync()
    );

    const lastSeq = lastInfo ? lastInfo : 0;
    const lotCode = code + (lastSeq + 1).toString().padStart(3, "0") + goodNameStr;
    const lotPrintCode = code + (lastSeq + 1).toString().padStart(3, "0") + reNameGoodStr;

    const lotInfo = await db.lotHistory
      .insertAsync({
        companyId,
        lot: lotPrintCode,
        seq: 0,
        printLot: lotPrintCode,
        productionId,
        rewindId,
        warehouseId,
        goodId,
        length: undefined,
        weight: undefined,
        width: undefined,
        thick: undefined,
        isTesting: false,
        isNotStock: false,
        createdAtDateTime: new DateTime(),
        createdByEmployeeId: employeeId
      });

    return {
      goodId,
      seq: 0,
      code: undefined,
      lotId: lotInfo.id,
      lotName: lotCode,
      length: undefined,
      weight: undefined
    };
  }

  /*  public static async getLotCode(db: MainDbContext, companyId: number, employeeId: number, warehouseId: number, goodId: number, documentCode: string, length?: number, weight?: number, width?: string, thick?: number, productionId?: number, rewindId?: number): Promise<ILotInfo> {

      const lastInfo = (
        await db.lotHistory
          .where(item => [
            sorm.equal(item.companyId, companyId),
            sorm.includes(item.lot, documentCode)
          ])
          .orderBy(item => item.lot, true)
          .top(1)
          .select(item => ({
            code: item.lot
          }))
          .singleAsync()
      );

      const lastSeq = lastInfo ? Number.parseInt(lastInfo!.code!.slice(-2), 10) : 0;
      const lotCode = documentCode + "-" + (lastSeq + 1).toString().padStart(2, "0");

      const lotInfo = await db.lotHistory
        .insertAsync({
          companyId,
          lot: lotCode,
          printLot: lotCode,
          seq: Number((lastSeq + 1).toString().padStart(2, "0")),
          productionId,
          rewindId,
          warehouseId,
          goodId,
          length,
          weight,
          width,
          thick,
          createdAtDateTime: new DateTime(),
          createdByEmployeeId: employeeId
        });

      return {
        goodId,
        seq: Number((lastSeq + 1).toString().padStart(2, "0")),
        code: documentCode,
        lotId: lotInfo.id,
        lotName: lotCode,
        length: lotInfo.length,
        weight: lotInfo.weight
      };
    }*/


  public static async printLot(db: MainDbContext, companyId: number, employeeId: number, warehouseId: number, goodId: number, seq: number, productionInstructionCode: string, productionId?: number, rewindId?: number): Promise<ILotInfo[] | undefined>;
  public static async printLot(db: MainDbContext, companyId: number, employeeId: number, warehouseId: number, goodId: number, lotCode: string, fromLotId: number, productionId?: number, rewindId?: number): Promise<ILotInfo | undefined>;
  public static async printLot(db: MainDbContext, companyId: number, employeeId: number, warehouseId: number, goodId: number, arg1: number | string, arg2: string | number, productionId?: number, rewindId?: number): Promise<ILotInfo | ILotInfo[] | undefined> {

    const seq = typeof arg1 === "number" ? arg1 : undefined;
    const lotCode = typeof arg1 === "string" ? arg1 : undefined;
    const productionInstructionCode = typeof arg2 === "string" ? arg2 : undefined;
    const fromLotId = typeof arg2 === "number" ? arg2 : undefined;

    const goodName = (
      await db.goods
        .where(item => [
          sorm.equal(item.id, goodId),
          sorm.equal(item.isDisabled, false)
        ])
        .select(item => ({
          name: item.name
        }))
        .singleAsync()
    )!.name;

    //문서번호 + seq 조합
    if (productionInstructionCode) {
      const result: ILotInfo[] = [];
      for (let i = 1; i <= seq!; i++) {
        result.push(await this.getLotCode2(db, companyId, employeeId, warehouseId, goodId, goodName, productionInstructionCode));
      }
      return result;
    }
    //사용자 지정 LOT (LOT전환 시)
    else {
      const isLot = await db.lotHistory.where(item => [sorm.equal(item.lot, lotCode)]).resultAsync();

      if (isLot && isLot.length > 0) {
        return undefined;
      }

      const fromLotInfo = await db.lotHistory.where(item => [sorm.equal(item.id, fromLotId)]).singleAsync();
      const lotCodeSeqName = lotCode!.substring(0, 8);

      const isSeq = await db.lotHistory.where(item => [sorm.includes(item.lot, lotCodeSeqName)]).select(item => ({seq: sorm.max(item.seq)})).singleAsync();

      const lotSeq = isSeq ? isSeq!.seq! + 1 : 1;

      const newLot = await db.lotHistory
        .insertAsync({
          companyId,
          type: fromLotInfo!.type,
          equipmentId: fromLotInfo!.equipmentId,
          warehouseId,
          productionId,
          rewindId,
          lot: lotCode!,
          printLot: lotCode!,
          seq: Number(lotSeq),
          goodId,
          length: fromLotInfo!.length,
          weight: fromLotInfo!.weight,
          width: fromLotInfo!.width,
          thick: fromLotInfo!.thick,
          goodsRating: fromLotInfo!.goodsRating,
          isTesting: false,
          isNotStock: false,
          createdAtDateTime: new DateTime(),
          createdByEmployeeId: employeeId
        });

      const lotInfo: ILotInfo = {
        goodId,
        seq: Number(lotSeq),
        code: undefined,
        lotId: newLot.id,
        lotName: lotCode,
        length: undefined,
        weight: undefined
      };

      return lotInfo;
    }

  }
}

export interface ILotInfo {
  goodId: number | undefined;
  code: string | undefined;
  seq: number | undefined;
  lotId: number | undefined;
  lotName: string | undefined;
  length: number | undefined;
  weight: number | undefined;
}
