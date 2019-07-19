import {SdModalBase, SdOrmProvider, SdToastProvider} from "@simplism/angular";
import {ChangeDetectionStrategy, ChangeDetectorRef, Component} from "@angular/core";
import {sorm} from "@simplism/orm-query";
import {AppDataProvider} from "@sample/client-common";
import {MainDbContext} from "@sample/main-database";
import {DateTime} from "@simplism/core";

@Component({
  selector: "app-raw-material-coasts-view-modal",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `

    <sd-dock-container style="min-width: 550px;">
      <sd-busy-container [busy]="busyCount > 0">
        <sd-dock-container>
          <sd-dock class="sd-background-white sd-padding-sm-default" *ngIf="items">
            <table class="_test">
              <tbody>
              <tr style="height:30px;">
                <th class="sd-padding-xs-sm" [rowSpan]="items.length">원<br>재<br>료<br>비</th>
                <th class="sd-padding-xs-sm">NO</th>
                <th class="sd-padding-xs-sm" style="width: 200px;">품명</th>
                <th class="sd-padding-xs-sm" style="width: 60px;">중량</th>
                <th class="sd-padding-xs-sm" style="width: 60px;">%</th>
                <th class="sd-padding-xs-sm" style="width: 70px;">원재료가</th>
                <th class="sd-padding-xs-sm">단가</th>
                <th class="sd-padding-xs-sm" style="width: 100px;">기준일자</th>
              </tr>
              <tr *ngFor="let item of items.innerLayer; trackBy: trackByMeFn">
                <td class="sd-padding-xs-sm">{{ item.seq }}</td>
                <td class="sd-padding-xs-sm">{{ item.goodName }}</td>
                <td class="sd-padding-xs-sm" style="text-align: right;">{{ item.weight }}</td>
                <td class="sd-padding-xs-sm" style="text-align: right;">{{ item.percent }}</td>
                <td class="sd-padding-xs-sm"><b>{{ item.materialPrice | number }}</b></td>
                <td class="sd-padding-xs-sm"><b>{{ item.unitPrice | number }}</b></td>
                <td class="sd-padding-xs-sm">{{ item.standardDate?.toFormatString("yyyy-MM-dd") }}</td>
              </tr>
              <tr>
                <td class="sd-padding-xs-sm" colspan="4"></td>
                <td class="sd-padding-xs-sm"><b>{{ items.innerTotalPrice | number }}</b></td>
                <td class="sd-padding-xs-sm"><b>{{ items.innerTotalUnitPrice | number }}</b></td>
                <td class="sd-padding-xs-sm"></td>
              </tr>
              <tr *ngFor="let item of items.middleLayer; trackBy: trackByMeFn">
                <td class="sd-padding-xs-sm">{{ item.seq }}</td>
                <td class="sd-padding-xs-sm">{{ item.goodName }}</td>
                <td class="sd-padding-xs-sm" style="text-align: right;">{{ item.weight }}</td>
                <td class="sd-padding-xs-sm" style="text-align: right;">{{ item.percent }}</td>
                <td class="sd-padding-xs-sm"><b>{{ item.materialPrice | number }}</b></td>
                <td class="sd-padding-xs-sm"><b>{{ item.unitPrice | number }}</b></td>
                <td class="sd-padding-xs-sm">{{ item.standardDate?.toFormatString("yyyy-MM-dd") }}</td>
              </tr>
              <tr>
                <td class="center" colspan="4"></td>
                <td class="right"><b>{{ items.middleTotalPrice | number }}</b></td>
                <td class="right"><b>{{ items.middleTotalUnitPrice | number }}</b></td>
                <td class="center"></td>
              </tr>
              <tr *ngFor="let item of items.outerLayer; trackBy: trackByMeFn">
                <td class="sd-padding-xs-sm">{{ item.seq }}</td>
                <td class="sd-padding-xs-sm">{{ item.goodName }}</td>
                <td class="sd-padding-xs-sm" style="text-align: right;">{{ item.weight }}</td>
                <td class="sd-padding-xs-sm" style="text-align: right;">{{ item.percent }}</td>
                <td class="sd-padding-xs-sm"><b>{{ item.materialPrice | number }}</b></td>
                <td class="sd-padding-xs-sm"><b>{{ item.unitPrice | number }}</b></td>
                <td class="sd-padding-xs-sm">{{ item.standardDate?.toFormatString("yyyy-MM-dd") }}</td>
              </tr>
              <tr>
                <td class="sd-padding-xs-sm" colspan="4"></td>
                <td class="sd-padding-xs-sm"><b>{{ items.outerTotalPrice | number }}</b></td>
                <td class="sd-padding-xs-sm"><b>{{ items.outerTotalUnitPrice | number }}</b></td>
                <td class="sd-padding-xs-sm"></td>
              </tr>
              <tr>
                <th class="sd-padding-xs-sm" colspan="6">단가 계</th>
                <td class="sd-padding-xs-sm"><b>{{ items.totalUnitPrice |  number }}</b></td>
                <td class="sd-padding-xs-sm"></td>
              </tr>
              <tr>
                <th class="sd-padding-xs-sm" colspan="6">로스 포함 단가</th>
                <td class="sd-padding-xs-sm"><b>{{ items.totalUnitPriceInLoss |  number }}</b></td>
                <td class="sd-padding-xs-sm"></td>
              </tr>
              <tr>
                <th class="sd-padding-xs-sm" colspan="6">/g 단가</th>
                <td class="sd-padding-xs-sm"><b>{{ items.totalGramUnitPrice |  number }}</b></td>
                <td class="sd-padding-xs-sm"></td>
              </tr>
              </tbody>
            </table>
          </sd-dock>

        </sd-dock-container>
      </sd-busy-container>
    </sd-dock-container>`,
  styles: [/* language=SCSS */ `
    ._test {
      border-collapse: collapse;
      border: 1px solid darkolivegreen;
      text-align: center;
      width: 100%;
      height: 100%;
    }

    thead {
      background: #EEEEEE;
    }

    th, td {
      border: 1px solid darkolivegreen;
      text-align: center;
    }

  `]
})
export class RawMaterialCostsViewModal extends SdModalBase<{ goodId: number | undefined; bomListId: number }, any> {
  public filter: {
    goodId?: number;
    bomListId?: number;
    type?: "내층" | "중층" | "외층";
  } = {};

  public lastFilter?: {
    goodId?: number;
    bomListId?: number;
    type?: "내층" | "중층" | "외층";
  };

  public items?: IRawMaterialCostsVM;

  public busyCount = 0;

  public trackByIdFn(item: any): number {
    return item.id;
  }

  public trackByMeFn = (i: number, item: any) => item;

  public constructor(private readonly _orm: SdOrmProvider,
                     private readonly _cdr: ChangeDetectorRef,
                     private readonly _appData: AppDataProvider,
                     private readonly _toast: SdToastProvider) {
    super();
  }

  public async sdOnOpen(param: { goodId: number | undefined; bomListId: number }): Promise<void> {
    this.busyCount++;

    this.filter.goodId = param.goodId;
    this.filter.bomListId = param.bomListId;

    await this.onSearchFormSubmit();

    this.busyCount--;
    this._cdr.markForCheck();
  }

  public async onSearchFormSubmit(): Promise<void> {
    this.lastFilter = Object.clone(this.filter);
    await this._search();
  }

  private async _search(): Promise<void> {
    this.busyCount++;

    try {
      await this._orm.connectAsync(MainDbContext, async db => {

        this.items = {
          innerLayer: [],
          innerTotalPrice: undefined,
          innerTotalUnitPrice: undefined,
          middleLayer: [],
          middleTotalPrice: undefined,
          middleTotalUnitPrice: undefined,
          outerLayer: [],
          outerTotalPrice: undefined,
          outerTotalUnitPrice: undefined,
          totalWeight: undefined,
          totalUnitPrice: undefined,
          totalUnitPriceInLoss: undefined,
          totalGramUnitPrice: undefined,
          length: undefined
        };

        let seq = 1;
        const totalWeight = await this._getBomListInfo(db);

        this.items!.totalWeight = totalWeight;
        this.items!.innerLayer = await this._getSearchLayerInfo(db, "내층");
        this.items!.innerLayer!.forEach(item => {
          item.seq = seq++;
          item.percent = Number(item.percent && item.percent.toFixed(2));
          item.weight = Number(item.weight && item.weight.toFixed(2));
          item.materialPrice = Number(item.materialPrice && item.materialPrice.toFixed(2));
          const unitPrice = item.materialPrice * (item.percent * 0.01) * (this.items!.innerLayer!.sum(item1 => (item1.weight || 0) * 0.001) || 0);
          item.unitPrice = Number(unitPrice ? unitPrice.toFixed(2) : 0);
        });
        this.items.innerTotalUnitPrice = isNaN((this.items.innerLayer!.sum(item => item.unitPrice || 0) || 0) / ((this.items.innerLayer!.sum(item => item.percent || 0)) || 0)) ? 0
          : ((this.items.innerLayer!.sum(item => item.unitPrice || 0) || 0) / ((this.items.innerLayer!.sum(item => item.percent || 0)) || 0));
        this.items.innerTotalPrice = this.items.innerLayer!.sum(item => item.materialPrice || 0);

        this.items.middleLayer = await this._getSearchLayerInfo(db, "중층");
        this.items.middleLayer!.forEach(item => {
          item.seq = seq++;
          item.percent = Number(item.percent && item.percent.toFixed(2));
          item.weight = Number(item.weight && item.weight.toFixed(2));
          item.materialPrice = Number(item.materialPrice && item.materialPrice.toFixed(2));
          const unitPrice = item.materialPrice * (item.percent * 0.01) * (this.items!.middleLayer!.sum(item1 => (item1.weight || 0) * 0.001) || 0);
          item.unitPrice = Number(unitPrice ? unitPrice.toFixed(2) : 0);
        });
        this.items.middleTotalUnitPrice = isNaN((this.items.middleLayer!.sum(item => item.unitPrice || 0) || 0) / ((this.items.middleLayer!.sum(item => item.percent || 0)) || 0)) ? 0
          : ((this.items.middleLayer!.sum(item => item.unitPrice || 0) || 0) / ((this.items.middleLayer!.sum(item => item.percent || 0)) || 0));
        this.items.middleTotalPrice = this.items.middleLayer!.sum(item => item.materialPrice || 0);

        this.items.outerLayer = await this._getSearchLayerInfo(db, "외층");
        this.items.outerLayer!.forEach(item => {
          item.seq = seq++;
          item.percent = Number(item.percent && item.percent.toFixed(2));
          item.weight = Number(item.weight && item.weight.toFixed(2));
          item.materialPrice = Number(item.materialPrice && item.materialPrice.toFixed(2));
          const unitPrice = item.materialPrice * (item.percent * 0.01) * (this.items!.outerLayer!.sum(item1 => (item1.weight || 0) * 0.001) || 0);
          item.unitPrice = Number(unitPrice ? unitPrice.toFixed(2) : 0);
        });
        this.items.outerTotalUnitPrice = isNaN((this.items.outerLayer!.sum(item => item.unitPrice || 0) || 0) / ((this.items.outerLayer!.sum(item => item.percent || 0)) || 0)) ? 0
          : ((this.items.outerLayer!.sum(item => item.unitPrice || 0) || 0) / ((this.items.outerLayer!.sum(item => item.percent || 0)) || 0));
        this.items.outerTotalPrice = this.items.outerLayer!.sum(item => item.materialPrice || 0);

        this.items.totalUnitPrice = this.items.innerTotalUnitPrice + this.items.middleTotalUnitPrice + this.items.outerTotalUnitPrice;
        this.items.totalUnitPriceInLoss = this.items.innerTotalUnitPrice + this.items.middleTotalUnitPrice + this.items.outerTotalUnitPrice;
        this.items.totalGramUnitPrice = isNaN(this.items.totalUnitPrice / (this.items!.totalWeight || 0)) ? 0
          : Number((this.items.totalUnitPrice / (this.items!.totalWeight! || 0)).toFixed(2));
        this.items.length = 4 + this.items.innerLayer!.length + this.items.middleLayer!.length + this.items.outerLayer!.length;
      });
    }
    catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }
    finally {
      this.busyCount--;
      this._cdr.markForCheck();
    }
  }

  private async _getSearchLayerInfo(db: MainDbContext, type: "내층" | "중층" | "외층"): Promise<ILayerInfoVM[] | undefined> {
    let result: ILayerInfoVM[] | undefined;

    result = await db.goodsBuildGoods
      .include(item => item.goods)
      .where(item => [
        sorm.equal(item.companyId, this._appData.authInfo!.companyId),
        sorm.equal(item.bomListId, this.lastFilter!.bomListId),
        sorm.equal(item.type, type)
      ])
      .select(item => ({
        id: item.id,
        seq: item.id,
        layer: item.type,
        goodId: item.goodsId,
        goodName: item.goods!.name,
        weight: item.weight,
        percent: item.mixPercent,
        materialPrice: item.goods!.unitPrice,
        unitPrice: 1,
        standardDate: item.goods!.createdAtDateTime
      }))
      .resultAsync();

    return result;
  }

  private async _getBomListInfo(db: MainDbContext): Promise<number | undefined> {
    let totalWeight: any | undefined;

    totalWeight = await db.goodsBuildList
      .where(item => [
        sorm.equal(item.companyId, this._appData.authInfo!.companyId),
        sorm.equal(item.id, this.lastFilter!.bomListId)
      ])
      .select(item => ({
        totalWeight: item.totalWeight
      }))
      .singleAsync();

    return totalWeight ? totalWeight.totalWeight === 0 ? undefined : totalWeight.totalWeight : undefined;
  }
}

interface IRawMaterialCostsVM {
  innerLayer: ILayerInfoVM[] | undefined;
  innerTotalPrice: number | undefined;
  innerTotalUnitPrice: number | undefined;
  middleLayer: ILayerInfoVM[] | undefined;
  middleTotalPrice: number | undefined;
  middleTotalUnitPrice: number | undefined;
  outerLayer: ILayerInfoVM[] | undefined;
  outerTotalPrice: number | undefined;
  outerTotalUnitPrice: number | undefined;
  totalWeight: number | undefined;
  totalUnitPrice: number | undefined;
  totalUnitPriceInLoss: number | undefined;
  totalGramUnitPrice: number | undefined;
  length: number | undefined;
}

interface ILayerInfoVM {
  id: number | undefined;
  seq: number | undefined;
  layer: "내층" | "외층" | "중층" | undefined;
  goodId: number | undefined;
  goodName: string | undefined;
  weight: number | undefined;
  percent: number | undefined;
  materialPrice: number | undefined;
  unitPrice: number | undefined;
  standardDate: DateTime | undefined;
}

//TODO: LOSS포함 단가 변경해야 할 경우 수정필요함