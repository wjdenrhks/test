import {Component} from "@angular/core";
import {SdOrmProvider, SdPrintTemplateBase} from "@simplism/angular";
import {CodeProc, MainDbContext} from "@sample/main-database";
import {AppDataProvider} from "@sample/client-common";
import {DateOnly} from "@simplism/core";

@Component({
  selector: "app-barcode-print-template",
  template: `
    <main *ngFor="let item of items; trackBy: trackByMeFn">
      <div class="printArea">
        <div style="border: black">
        </div>
        <sd-barcode [value]="item.barcode"
                    [lineWidth]="3"
                    [height]="140"></sd-barcode>
        <br/>
        <h1><strong>테스트 바코드&nbsp;</strong></h1>
        <div style="float: left;">
        </div>

      </div>
    </main>
  `,
  styles: [`
    @page {
      size: A3;
    }

    .printArea > h1 {
      color: black;
      text-align: center;
      margin: 0;
      padding: 0;
    }

    .printArea > h1 > table{

    }

    .printArea {
      width: 94%;
      margin: 0 auto;
      padding: 20pt 0;
      -webkit-box-sizing: border-box;
      -moz-box-sizing: border-box;
      box-sizing: border-box;
    }

    table {
      border-collapse: collapse;
      width: 100%;
    }

    td, th {
      text-align: center;
      border: 1pt solid #121212;
      font-size: 9pt;
    }

    td strong, th strong, td span, th span {
      font-size: 14pt;
    }

    td strong, th strong {
      font-weight: 800;
    }

  `]
})
export class BarcodePrintTemplate extends SdPrintTemplateBase<any> {

  public items?: IBarcodePrintVM[] = [];
  public item: {
    type: string | undefined;
    equipmentId: number | undefined;
    equipmentCode: string | undefined;
    planDate: DateOnly | undefined;
    startCount: number | undefined;
    endCount: number | undefined;
    barcode: string | undefined;
    goodId: number | undefined;
    goodName: string | undefined;
  } = {
    type: undefined,
    planDate: undefined,
    equipmentId: undefined,
    equipmentCode: undefined,
    startCount: undefined,
    endCount: undefined,
    barcode: undefined,
    goodId: undefined,
    goodName: undefined
  };

  public isOnly?: boolean;
  public trackByMeFn = (i: number, item: any) => item;

  public constructor(private readonly _orm: SdOrmProvider,
                     private readonly _appData: AppDataProvider) {
    super();
  }

  public async sdOnOpen(param: any): Promise<void> {

    this.item = {
      type: param.type,
      planDate: param.planDate,
      equipmentId: param.equipmentId,
      equipmentCode: param.equipmentCode,
      startCount: param.startCount,
      endCount: param.endCount,
      barcode: undefined,
      goodId: param.goodId,
      goodName: param.goodName
    };

    //TODO: LOT 모아찍기 할 건지 한장씩 출력할 건지 선택 할 수 있도록 (생산창고 코드도 수정해야함)
    this.isOnly = true;

    const seq = Number(this.item.endCount!) - Number(this.item.startCount!) + 1;
    this.items = [];

    await this._orm.connectAsync(MainDbContext, async db => {
      const document = await CodeProc.getDocumentCode(db, this._appData!.authInfo!.companyId,
        this._appData!.authInfo!.employeeId, this.item.goodId!, this.item.planDate, this.item.type!, this.item.equipmentId, this.item.equipmentCode);

      const lotList = await CodeProc.printLot(db, this._appData!.authInfo!.companyId,
        this._appData!.authInfo!.employeeId, 1, this.item.goodId!, seq, document);

      if (this.isOnly) {
        const startSeq = lotList && lotList[0].lotName!.split("-")[1];
        const endSeq = lotList && lotList.last()!.lotName!.split("-")[1];

        this.items!.push({
          goodName: param.goodName,
          barcode: document + "-" + startSeq + "~" + endSeq
        });
      }
      else {
        this.items = lotList && lotList.map(item => ({
          goodName: param.goodName,
          barcode: item.lotName
        }));
      }

    });

  }
}

interface IBarcodePrintVM {
  goodName: string | undefined;
  barcode: string | undefined;
}