import {ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, OnInit} from "@angular/core";
import {SdModalProvider, SdOrmProvider, SdSocketProvider, SdToastProvider} from "@simplism/angular";
import {AppDataProvider} from "@sample/client-common";
import {MainDbContext, MySqlProc, Partner} from "@sample/main-database";
import {sorm} from "@simplism/orm-query";
import {Queryable} from "@simplism/orm-client";
import {ShowManualModal} from "../../modals/ShowManualModal";
import {DateTime} from "@simplism/core";
import {ExcelWorkbook} from "@simplism/excel";

@Component({
  selector: "app-partner",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-busy-container [busy]="viewBusyCount > 0">
      <sd-topbar-container>
        <sd-topbar class="sd-background-secondary-darkest">
          <h4>거래처 관리</h4>
          <sd-topbar-menu (click)="onAddItemButtonClick()">
            <sd-icon [icon]="'plus'" [fixedWidth]="true"></sd-icon>
            행 추가
          </sd-topbar-menu>
          <sd-topbar-menu (click)="onSaveButtonClick()">
            <sd-icon [icon]="'save'" [fixedWidth]="true"></sd-icon>
            저장
          </sd-topbar-menu>
          <sd-topbar-menu (click)="onDownloadButtonClick()" *ngIf="items">
            <sd-icon [icon]="'download'" [fixedWidth]="true"></sd-icon>
            다운로드
          </sd-topbar-menu>
          <sd-topbar-menu (click)="onShowManualButtonClick()" style="float: right; padding-right: 25px;">
            <sd-icon [icon]="'atlas'" [fixedWidth]="true"></sd-icon>
            메뉴얼 보기
          </sd-topbar-menu>

        </sd-topbar>
        <sd-dock-container>
          <sd-dock class="sd-padding-sm-default sd-background-grey-lightest">
            <sd-form [inline]="true" (submit)="onSearchFormSubmit()">
              <sd-form-item [label]="'정렬기준'">
                <sd-select [(value)]="filter.sort">
                  <sd-select-item [value]="sort.type" *ngFor="let sort of sortTypes; trackBy: trackByMeFn">
                    {{ sort.name }}
                  </sd-select-item>
                </sd-select>
              </sd-form-item>
              <sd-form-item [label]="'거래처명'">
                <sd-textfield [(value)]="filter.name"></sd-textfield>
              </sd-form-item>
              <sd-form-item [label]="'거래처 구분'">
                <sd-select [(value)]="filter.type">
                  <sd-select-item [value]="undefined">전체</sd-select-item>
                  <sd-select-item [value]="'매출처'">매출 거래처</sd-select-item>
                  <sd-select-item [value]="'매입처'">매입 거래처</sd-select-item>
                  <sd-select-item [value]="'본사'">본사</sd-select-item>
                </sd-select>
              </sd-form-item>
              <sd-form-item [label]="'수출업체 여부'">
                <sd-select [(value)]="filter.isExport">
                  <sd-select-item [value]="undefined">전체</sd-select-item>
                  <sd-select-item [value]="false">일반 거래처</sd-select-item>
                  <sd-select-item [value]="true">수출 거래처</sd-select-item>
                </sd-select>
              </sd-form-item>
              <sd-form-item>
                <sd-checkbox [(value)]="filter.isDisabled">사용중지</sd-checkbox>
              </sd-form-item>
              <sd-form-item>
                <sd-button [type]="'submit'" [theme]="'primary'">
                  <sd-icon [icon]="'search'" [fixedWidth]="true"></sd-icon>
                  조회
                </sd-button>
              </sd-form-item>
            </sd-form>
          </sd-dock>

          <sd-dock class="sd-padding-sm-default">
            <sd-pagination [page]="pagination.page" [length]="pagination.length"
                           (pageChange)="onPageClick($event)"></sd-pagination>
          </sd-dock>

          <sd-busy-container [busy]="mainBusyCount > 0">
            <sd-sheet #sheet [id]="'partner'" [items]="items" [trackBy]="trackByIdFn">
              <sd-sheet-column [header]="'ID'" [fixed]="true" [width]="40">
                <ng-template #item let-item="item">
                  <div class="sd-padding-xs-sm" style="text-align: center;">
                    <span *ngIf="item.id">{{ item.viewId }}</span>
                  </div>
                </ng-template>
              </sd-sheet-column>
              
              <sd-sheet-column [header]="'거래처명'" [fixed]="true" [width]="200">
                <ng-template #item let-item="item">
                  <sd-textfield [(value)]="item.name" [required]="true"
                                ></sd-textfield>
                </ng-template>
              </sd-sheet-column>
              
              <sd-sheet-column [header]="'사업자번호'">
                <ng-template #item let-item="item">
                  <sd-textfield [(value)]="item.registrationNumber"
                  ></sd-textfield>
                </ng-template>
              </sd-sheet-column>
              <sd-sheet-column [header]="'대표자명'">
                <ng-template #item let-item="item">
                  <sd-textfield [(value)]="item.representative"
                  ></sd-textfield>
                </ng-template>
              </sd-sheet-column>
              <sd-sheet-column [header]="'담당자명'">
                <ng-template #item let-item="item">
                  <sd-textfield [(value)]="item.inCharge"
                  ></sd-textfield>
                </ng-template>
              </sd-sheet-column>
              <sd-sheet-column [header]="'전화번호'">
                <ng-template #item let-item="item">
                  <sd-textfield [(value)]="item.tel"
                  ></sd-textfield>
                </ng-template>
              </sd-sheet-column>
              <sd-sheet-column [header]="'이메일'">
                <ng-template #item let-item="item">
                  <sd-textfield [(value)]="item.emailAddress"
                  ></sd-textfield>
                </ng-template>
              </sd-sheet-column>
              <sd-sheet-column [header]="'거래처 구분'">
                <ng-template #item let-item="item">
                  <sd-select [(value)]="item.type">
                    <sd-select-item [value]="'매출처'">매출 거래처</sd-select-item>
                    <sd-select-item [value]="'매입처'">매입 거래처</sd-select-item>
                    <sd-select-item [value]="'본사'">본사</sd-select-item>
                  </sd-select>
                  <!--<sd-textfield [(value)]="item.type"
                  ></sd-textfield>-->
                </ng-template>
              </sd-sheet-column>
              <sd-sheet-column [header]="'수출업체 여부'">
                <ng-template #item let-item="item">
                  <sd-select [(value)]="item.isExport">
                    <sd-select-item [value]="true">일반 거래처</sd-select-item>
                    <sd-select-item [value]="false">수출 거래처</sd-select-item>
                  </sd-select>
                  <!--<div class="sd-padding-xs-sm" style="text-align: center;">
                    {{ item.isExport === false ? "일반 거래처" : item.isExport === true ? "수출 거래처" : "" }}
                  </div>-->
                </ng-template>
              </sd-sheet-column>

              <sd-sheet-column [header]="'메모'">
                <ng-template #item let-item="item">
                  <sd-textfield [(value)]="item.remark"
                  ></sd-textfield>
                </ng-template>
              </sd-sheet-column>
              <sd-sheet-column [header]="'등록일'">
                <ng-template #item let-item="item">
                  <div class="sd-padding-xs-sm" style="text-align: center;">
                    {{ item.createdAtDateTime?.toFormatString("yyyy-MM-dd") }}
                  </div>
                </ng-template>
              </sd-sheet-column>
              <sd-sheet-column [header]="'사용중지'" [width]="60">
                <ng-template #item let-item="item">
                  <div style="text-align: center;">
                    <sd-checkbox [(value)]=" item.isDisabled "></sd-checkbox>
                  </div>
                </ng-template>
              </sd-sheet-column>
            </sd-sheet>
          </sd-busy-container>
        </sd-dock-container>
      </sd-topbar-container>
    </sd-busy-container>`
})
export class PartnerPage implements OnInit {

  public filter: IFilterVM = {
    sort: "id",
    name: undefined,
    type: undefined,
    isExport: undefined,
    isDisabled: false
  };
  public lastFilter?: IFilterVM;

  public pagination = {page: 0, length: 0};

  public items: IPartnerVM[] = [];
  public orgItems: IPartnerVM[] = [];

  public viewBusyCount = 0;
  public mainBusyCount = 0;

  public types: string[] = [];

  public sortTypes?: {
    name: string;
    type: string;
  }[];

  public trackByIdFn = (i: number, item: any) => item.id || item;
  public trackByMeFn = (i: number, item: any) => item;

  public constructor(private readonly _cdr: ChangeDetectorRef,
                     private readonly _orm: SdOrmProvider,
                     private readonly _modal: SdModalProvider,
                     private readonly _socket: SdSocketProvider,
                     private readonly _toast: SdToastProvider,
                     private readonly _appData: AppDataProvider) {
  }

  public async ngOnInit(): Promise<void> {
    this.sortTypes = [
      {name: "ID", type: "id"},
      {name: "거래처명", type: "name"}
    ];

    await this._syncPartner();
    await this.onSearchFormSubmit();
    this._cdr.markForCheck();
  }

  public async onDownloadButtonClick(): Promise<void> {
    await this._download();
    this._cdr.markForCheck();
  }

  private async _download(): Promise<void> {
    this.viewBusyCount++;
    try {


      const wb = ExcelWorkbook.create();
      const ws = wb.createWorksheet(`거래처 관리`);

      ws.cell(0, 0).merge(0, 11);
      ws.cell(0, 0).value = "거래처 관리";
      ws.cell(1, 0).value = "ID";
      ws.cell(1, 1).value = "거래처명";
      ws.cell(1, 2).value = "사업자번호";
      ws.cell(1, 3).value = "대표자명";
      ws.cell(1, 4).value = "담당자명";
      ws.cell(1, 5).value = "전화번호";
      ws.cell(1, 6).value = "이메일";
      ws.cell(1, 7).value = "거래처구분";
      ws.cell(1, 8).value = "수출업체 여부";
      ws.cell(1, 9).value = "메모";
      ws.cell(1, 10).value = "등록일";
      ws.cell(1, 11).value = "사용중지";


      console.log(this.items);
      //console.log((this.items[0].createdAtDateTime)!.toFormatString("yyyy-MM-dd"));


      let nowScrapSeq = 0;
      for(const nowScrapItem of this.items! || []){
        ws.cell(2 + nowScrapSeq, 0).value = nowScrapItem.viewId;
        ws.cell(2 + nowScrapSeq, 1).value = nowScrapItem.name;
        ws.cell(2 + nowScrapSeq, 2).value = nowScrapItem.registrationNumber;
        ws.cell(2 + nowScrapSeq, 3).value = nowScrapItem.representative;
        ws.cell(2 + nowScrapSeq, 4).value = nowScrapItem.inCharge;
        ws.cell(2 + nowScrapSeq, 5).value = nowScrapItem.tel;
        ws.cell(2 + nowScrapSeq, 6).value = nowScrapItem.emailAddress;
        ws.cell(2 + nowScrapSeq, 7).value = nowScrapItem.type;
        nowScrapItem.isExport === false ? ws.cell(2 + nowScrapSeq, 8).value = "수출 거래처" 
          : ws.cell(2 + nowScrapSeq, 8).value = "일반 거래처" ;
        ws.cell(2 + nowScrapSeq, 9).value = nowScrapItem.remark;
        //ws.cell(2 + nowScrapSeq, 10).value = (nowScrapItem.createdAtDateTime)!.toFormatString('yyyy-MM-dd');
        nowScrapItem.createdAtDateTime === undefined ? ws.cell(2 + nowScrapSeq, 10).value = ""
        : ws.cell(2 + nowScrapSeq, 10).value = (nowScrapItem.createdAtDateTime)!.toFormatString('yyyy-MM-dd');
        nowScrapItem.isDisabled === false ? ws.cell(2 + nowScrapSeq, 11).value = ""
          : ws.cell(2 + nowScrapSeq, 11).value = "V";
        nowScrapSeq++;
      }



      const title = "거래처관리.xlsx";

      await wb.downloadAsync(title);
    }
    catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }

    this.viewBusyCount--;
  }

  public onAddItemButtonClick(): void {
    this.items.insert(0, {
      viewId: undefined,
      id: undefined,
      name: undefined,
      registrationNumber: undefined,
      inCharge: undefined,
      emailAddress: undefined,
      type: undefined,
      isExport: undefined,
      remark: undefined,
      createdAtDateTime: new DateTime(),

      isDisabled: false,
      representative: undefined,
      tel: undefined
    });
  }

  public async onShowManualButtonClick(): Promise<void> {
    const result = await this._modal.show(ShowManualModal, "거래처 정보 메뉴얼", {type: "partner"});
    if (!result) return;

    this._cdr.markForCheck();
  }

  public async onSearchFormSubmit(): Promise<void> {
    this.pagination.page = 0;
    this.lastFilter = Object.clone(this.filter);
    await this._search();
    this._cdr.markForCheck();
  }

  public async onPageClick(page: number): Promise<void> {
    this.pagination.page = page;
    await this._search();
    this._cdr.markForCheck();
  }

  private async _syncPartner(): Promise<void> {
    this.mainBusyCount++;
    try {
      await this._orm.connectAsync(MainDbContext, async db => {
        await MySqlProc.syncPartner(db, this._socket);
      });
    }
    catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }

    this.mainBusyCount--;
  }

  private async _search(): Promise<void> {
    if (!this.lastFilter) return;

    this.mainBusyCount++;
    try {
      await this._orm.connectAsync(MainDbContext, async db => {

        const queryable = this._getSearchQueryable(db);
        const sortQuery = "[TBL]." + this.lastFilter!.sort;

        this.items = await queryable
          .orderBy(item => sorm.query(sortQuery, String))
          .select(item => ({
            viewId: sorm.query("ROW_NUMBER() OVER (ORDER BY" + sortQuery + " ASC)", Number),
            id: item.id,
            //erpSyncCode: item.erpSyncCode,
            //companyType: item.companyType,
            name: item.name,
            //partnerCode: item.partnerCode,
            //representative: item.representative,
            registrationNumber: item.registrationNumber,
            inCharge: item.inCharge,
            //businessRegistrationNumber: item.businessRegistrationNumber,
            //tel: item.tel,
            //phoneNumber: item.phoneNumber,
            //faxNumber: item.faxNumber,
            emailAddress: item.emailAddress,
            //homePage: item.homePage,
            //businessConditions: item.businessConditions,
            //event: item.event,
            //address: item.address,
            //addressDetail: item.addressDetail,
            //postcode: item.postcode,
            type: item.type,
            isExport: item.isExport,
            remark: item.remark,
            createdAtDateTime: item.createdAtDateTime,
            isDisabled: item.isDisabled,
            representative: item.representative,
            tel: item.tel
          }))
          .limit(this.pagination.page * 30, 30)
          .resultAsync();

        this.orgItems = Object.clone(this.items);

        const totalCount = await queryable.countAsync();
        this.pagination.length = Math.ceil(totalCount / 30);
      });
    }
    catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }

    this.mainBusyCount--;
  }

  // 저장 function
  public async onSaveButtonClick(): Promise<void> {
    await this._save();
    this._cdr.markForCheck();
  }

  @HostListener("document:keydown", ["$event"])
  public async onDocumentKeydown(event: KeyboardEvent): Promise<void> {
    if ((event.key === "s" || event.key === "S") && event.ctrlKey) {
      event.preventDefault();
      await this._save();
      this._cdr.markForCheck();
    }
  }

  private async _save(): Promise<void> {
    const diffTargets = this.orgItems.diffs(this.items, {keyProps: ["id"]}).map(item => item.target!);

    //추가되거나 변경된 로우가 나옴, 변경된게 없으면 []
    console.log(diffTargets);

    if (diffTargets.length < 1) {
      this._toast.info("변경사항이 없습니다.");
      if (process.env.NODE_ENV === "test") console.log("변경사항이 없습니다.");
      return;
    }

    for (const diffTargetItem of diffTargets) {
      if (!diffTargetItem.name) {
        this._toast.danger("거래처명은 반드시 입력해야 합니다.");
        return;
      }

      if (this.items.filter(item => (item.name === diffTargetItem.name)).length > 1) {
        this._toast.danger("거래처명에 동일한 값이 등록되어 있습니다. : " + diffTargetItem.name);
        return;
      }
    }
    this.viewBusyCount++;
    try {
      await this._orm.connectAsync(MainDbContext, async db => {
        for (const diffTarget of diffTargets) {
          const upsertedItem = await this._saveItem(db, diffTarget);
          diffTarget.id = upsertedItem.id;
          diffTarget.viewId = upsertedItem.id;
        }
      });

      this.orgItems = Object.clone(this.items);
      this._toast.success("저장되었습니다.");
    }
    catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }
    this.viewBusyCount--;
  }

  private async _saveItem(db: MainDbContext, upsertItem: IPartnerVM): Promise<IPartnerVM> {

    console.log(upsertItem.isDisabled);
    // INSERT
    if (!upsertItem.id) {
      // if (
      //   !upsertItem.isDisabled &&
      //   await db.partner
      //     .where(item => [
      //       sorm.notEqual(item.isDisabled, true),
      //       sorm.equal(item.type, upsertItem.type!),
      //       sorm.equal(item.name, upsertItem.name!),
      //       sorm.notEqual(item.id, upsertItem.id!)
      //     ])
      //     .countAsync() > 0
      // ) {
      //   throw new Error("\"" + upsertItem.type! + "\"에 동일한 이름이 등록되어 있습니다 : " + upsertItem.name!);
      // }

      const newItem = await db.partner
        .insertAsync({
          companyId: this._appData.authInfo!.companyId,
          name: upsertItem.name!,
          registrationNumber: upsertItem.registrationNumber,
          inCharge: upsertItem.inCharge,
          emailAddress: upsertItem.emailAddress,
          type: upsertItem.type,
          isExport: upsertItem.isExport,
          remark: upsertItem.remark,
          createdAtDateTime: upsertItem.createdAtDateTime!,
          isDisabled: upsertItem.isDisabled,
          representative: upsertItem.representative,
          tel: upsertItem.tel
        });

      return {
        ...upsertItem,
        id: newItem.id
      };
    }
    // UPDATE
    else {
      await db.partner
        .where(item => [
          sorm.equal(item.id, upsertItem.id)
        ])
        .updateAsync(
          () => ({
            companyId: this._appData.authInfo!.companyId,
            name: upsertItem.name!,
            registrationNumber: upsertItem.registrationNumber!,
            inCharge: upsertItem.inCharge,
            emailAddress : upsertItem.emailAddress,
            type : upsertItem.type,
            isExport : upsertItem.isExport,
            remark : upsertItem.remark,
            createdAtDateTime : upsertItem.createdAtDateTime,
            isDisabled : upsertItem.isDisabled,
            representative : upsertItem.representative,
            tel : upsertItem.tel
          })
        );

      return upsertItem;
    }
  }

  private _getSearchQueryable(db: MainDbContext): Queryable<Partner> {
    let queryable = db.partner
      .where(item => [
        sorm.equal(item.companyId, this._appData.authInfo!.companyId)
      ]);

    if (this.lastFilter!.name) {
      queryable = queryable.where(item => [
        sorm.includes(item.name, this.lastFilter!.name)
      ]);
    }

    if (this.lastFilter!.type !== undefined) {
      queryable = queryable.where(item => [
        sorm.equal(item.type, this.lastFilter!.type)
      ]);
    }

    if (this.lastFilter!.isExport !== undefined) {
      queryable = queryable.where(item => [
        sorm.equal(item.isExport, this.lastFilter!.isExport)
      ]);
    }

    queryable = queryable.where(item => [
      sorm.equal(item.isDisabled, this.lastFilter!.isDisabled)
    ]);

    return queryable;
  }
}

interface IFilterVM {
  sort?: string;
  name: string | undefined;
  type: "매입처" | "매출처" | "본사" | undefined;
  isExport: boolean | undefined;
  isDisabled: boolean;
}

interface IPartnerVM {
  viewId: number | undefined;
  id: number | undefined;
  name: string | undefined;
  registrationNumber: string | undefined;
  inCharge: string | undefined;
  emailAddress: string | undefined;
  type: "매입처" | "매출처" | "본사" | undefined;
  isExport: boolean | undefined;
  remark: string | undefined;
  createdAtDateTime: DateTime | undefined;
  isDisabled: boolean;
  representative: string | undefined;
  tel: string | undefined;

  // erpSyncCode: number | undefined;
  // companyType: string | undefined;
  // partnerCode: string | undefined;
  // representative: string | undefined;
  // businessRegistrationNumber: string | undefined;
  // tel: string | undefined;
  // phoneNumber: string | undefined;
  // faxNumber: string | undefined;
  // homePage: string | undefined;
  // businessConditions: string | undefined;
  // event: string | undefined;
  // address: string | undefined;
  // addressDetail: string | undefined;
  // postcode: string | undefined;
}