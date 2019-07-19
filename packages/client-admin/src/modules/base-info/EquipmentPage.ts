import {ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, OnInit} from "@angular/core";
import {DateOnly, DateTime} from "@simplism/core";
import {Equipment, MainDbContext, MySqlProc} from "@sample/main-database";
import {sorm} from "@simplism/orm-query";
import {Queryable} from "@simplism/orm-client";
import {SdModalProvider, SdOrmProvider, SdSocketProvider, SdToastProvider} from "@simplism/angular";
import {AppDataProvider} from "@sample/client-common";
import {ShowManualModal} from "../../modals/ShowManualModal";

@Component({
  selector: "app-equipment",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-busy-container [busy]="viewBusyCount > 0">
      <sd-topbar-container>
        <sd-topbar class="sd-background-secondary-darkest">
          <h4>설비 관리</h4>

          <sd-topbar-menu (click)="onSaveButtonClick()">
            <sd-icon [icon]="'save'" [fixedWidth]="true"></sd-icon>
            저장
          </sd-topbar-menu>
          <sd-topbar-menu (click)="onShowManualButtonClick()" style="float: right; padding-right: 25px;">
            <sd-icon [icon]="'atlas'" [fixedWidth]="true"></sd-icon>
            메뉴얼 보기
          </sd-topbar-menu>

          <!--<sd-topbar-menu *ngIf="lastFilter && (items && orgItems.length > 0)" (click)="onDownloadButtonClick()">
            <sd-icon [icon]="'download'" [fixedWidth]="true"></sd-icon>
            다운로드
          </sd-topbar-menu>-->
        </sd-topbar>

        <sd-dock-container>
          <sd-dock class="sd-padding-sm-default sd-background-grey-lightest">
            <sd-form [inline]="true" (submit)="onSearchFormSubmit()">
              <sd-form-item [label]="'설비명칭'">
                <sd-textfield [(value)]="filter.equipmentName"></sd-textfield>
              </sd-form-item>
              <sd-form-item [label]="'설비기호'">
                <sd-textfield [(value)]="filter.equipmentCode"></sd-textfield>
              </sd-form-item>
              <sd-form-item [label]="'사용중지 제외'">
                <sd-checkbox [(value)]="filter.isDisabled"></sd-checkbox>
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
            <sd-dock-container>
              <sd-sheet #sheet [id]="'equipment'"
                        [items]="items"
                        [trackBy]="trackByIdFn"
                        [(selectedItem)]="selectedItem"
                        [selectable]="true">
                <sd-sheet-column [header]="'ID'" [fixed]="true" [width]="40">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      <span *ngIf="item.id">{{ item.id }}</span>
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'설비명'">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm">
                      {{ item.name }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'설비기호'" [width]="90">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      {{ item.code }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'순서'" [width]="60">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      {{ item.seq }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'집계'" [width]="60">
                  <ng-template #item let-item="item">
                    <div style="text-align: center;">
                      <sd-checkbox [(value)]="item.isCount" [disabled]="true"></sd-checkbox>
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'사용중지'" [width]="70">
                  <ng-template #item let-item="item">
                    <div style="text-align: center;">
                      <sd-checkbox [(value)]="item.isDisabled" [disabled]="true"></sd-checkbox>
                    </div>
                  </ng-template>
                </sd-sheet-column>
              </sd-sheet>

              <sd-dock [position]="'bottom'" style="height: 40%" *ngIf="selectedItem"
                       [id]="'equipment-repair-list'">
                <sd-dock-container class="sd-background-default">
                  <sd-dock class="sd-padding-xs-sm">
                    <h5 style="display: inline-block; padding-right: 1.4em;">설비별 수리 이력</h5>
                    <sd-form [inline]="true">
                      <sd-form-item>
                        <sd-button [size]="'sm'" (click)="onAddRepairEquipmentButtonClick()">
                          <sd-icon [icon]="'plus'" [fixedWidth]="true"></sd-icon>
                          행 추가
                        </sd-button>
                      </sd-form-item>
                    </sd-form>
                  </sd-dock>

                  <sd-pane>
                    <sd-sheet [id]="'equipment-repair'"
                              [items]="selectedItem.repairList"
                              [trackBy]="trackByIdFn">
                      <sd-sheet-column [header]="'ID'" [fixed]="true" [width]="40">
                        <ng-template #item let-item="item">
                          <div class="sd-padding-xs-sm" style="text-align: center;">
                            <span *ngIf="item.id">{{ item.id }}</span>
                            <a *ngIf="!item.id" (click)="onRemoveItemRepairEquipmentButtonClick(item)">
                              <sd-icon [icon]="'times'" [fixedWidth]="true"></sd-icon>
                            </a>
                          </div>
                        </ng-template>
                      </sd-sheet-column>
                      <sd-sheet-column [header]="'발생일자'">
                        <ng-template #item let-item="item">
                          <sd-textfield [(value)]="item.repairDate" [type]="'date'"></sd-textfield>
                        </ng-template>
                      </sd-sheet-column>
                      <sd-sheet-column [header]="'내용'">
                        <ng-template #item let-item="item">
                          <sd-textfield [(value)]="item.remark"></sd-textfield>
                        </ng-template>
                      </sd-sheet-column>
                      <sd-sheet-column [header]="'결과'">
                        <ng-template #item let-item="item">
                          <sd-textfield [(value)]="item.result"></sd-textfield>
                        </ng-template>
                      </sd-sheet-column>
                      <sd-sheet-column [header]="'금액'" [width]="130">
                        <ng-template #item let-item="item">
                          <sd-textfield [(value)]="item.price"></sd-textfield>
                        </ng-template>
                      </sd-sheet-column>
                      <sd-sheet-column [header]="'등록자'">
                        <ng-template #item let-item="item">
                          <div class="sd-padding-xs-sm" style="text-align: center;">
                            {{ item.createdByEmployeeName }}
                          </div>
                        </ng-template>
                      </sd-sheet-column>
                      <sd-sheet-column [header]="'등록시간'">
                        <ng-template #item let-item="item">
                          <div class="sd-padding-xs-sm" style="text-align: center;">
                            {{ item.createdAtDateTime?.toFormatString("yyyy-MM-dd HH:mm") }}
                          </div>
                        </ng-template>
                      </sd-sheet-column>
                    </sd-sheet>
                  </sd-pane>
                </sd-dock-container>
              </sd-dock>
            </sd-dock-container>
          </sd-busy-container>
        </sd-dock-container>
      </sd-topbar-container>
    </sd-busy-container>`
})
export class EquipmentPage implements OnInit {

  public filter: IFilterVM = {
    equipmentName: undefined,
    equipmentCode: undefined,
    isCount: false,
    isDisabled: false
  };

  public lastFilter?: IFilterVM;

  public pagination = {page: 0, length: 0};

  public items: IEquipmentVM[] = [];
  public orgItems: IEquipmentVM[] = [];

  public selectedItem?: IEquipmentVM;


  public viewBusyCount = 0;
  public mainBusyCount = 0;

  public trackByIdFn = (i: number, item: any) => item.id || item;
  public trackByMeFn = (i: number, item: any) => item;

  public constructor(private readonly _orm: SdOrmProvider,
                     private readonly _modal: SdModalProvider,
                     private readonly _appData: AppDataProvider,
                     private readonly _toast: SdToastProvider,
                     private readonly _socket: SdSocketProvider,
                     private readonly _cdr: ChangeDetectorRef) {

  }

  public async ngOnInit(): Promise<void> {
    await this._syncEquipments();

    await this.onSearchFormSubmit();
    this._cdr.markForCheck();
  }

  public async onShowManualButtonClick(): Promise<void> {
    const result = await this._modal.show(ShowManualModal, "설비 메뉴얼", {type: "equipment"});
    if (!result) return;

    this._cdr.markForCheck();
  }

  // 행 추가 시 상단에서 클릭 한 설비의 설비 수리 이력을 입력할 수 있는 행이 추가 됩
  public onAddRepairEquipmentButtonClick(): void {
    // 이미 입력했던 설비 수리 이력이 있을 경우 엔 기존 리스트를, 없을 경우 엔 초기화
    this.selectedItem!.repairList = this.selectedItem!.repairList || [];

    // 추가 되는 행에 들어가는 정보들
    this.selectedItem!.repairList!.insert(0, {
      id: undefined,
      repairDate: new DateOnly(),
      remark: undefined,
      result: undefined,
      price: undefined,
      createdAtDateTime: undefined,
      createdByEmployeeId: undefined,
      createdByEmployeeName: undefined
    });
  }

  // 행을 삭제할 때
  public onRemoveItemRepairEquipmentButtonClick(item: IEquipmentRepairItemVM): void {
    // 현재 선택한 item 객체를 this.selectedItem!.repairList에서 삭제
    this.selectedItem!.repairList!.remove(item);
  }

  public async onSearchFormSubmit(): Promise<void> {
    this.pagination.page = 0;
    this.lastFilter = Object.clone(this.filter);
    await this._search();
    this._cdr.markForCheck();
  }

  // ERP 설비 데이터 초기화
  private async _syncEquipments(): Promise<void> {
    this.mainBusyCount++;
    try {
      await this._orm.connectAsync(MainDbContext, async db => {
        await MySqlProc.syncEquipments(db, this._socket);
      });
    }
    catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }

    this.mainBusyCount--;
  }

  public async onPageClick(page: number): Promise<void> {
    this.pagination.page = page;
    await this._search();
    this._cdr.markForCheck();
  }

  // 저장 function
  public async onSaveButtonClick(): Promise<void> {
    await this._save();
    this._cdr.markForCheck();
  }

  //키보드에서 ctrl+s 누르면 저장 되도록
  @HostListener("document:keydown", ["$event"])
  public async onDocumentKeydown(event: KeyboardEvent): Promise<void> {
    if ((event.key === "s" || event.key === "S") && event.ctrlKey) {
      event.preventDefault();
      await this._save();
      this._cdr.markForCheck();
    }
  }

  private async _save(): Promise<void> {
    // this.orgItems(기존 list)와 this.items(사용자가 수정)을 비교해서 this.items에서 this.orgItems과 동일 한 항목을 제외 함
    const diffTargets = this.orgItems.diffs(this.items, {keyProps: ["id"]}).map(item => item.target!);

    // this.itmes에서 this.orgItems을 제외한 list 길이가 1 미만이면 변경사항 없음 처리
    if (diffTargets.length < 1) {
      this._toast.info("변경사항이 없습니다.");
      if (process.env.NODE_ENV === "test") console.log("변경사항이 없습니다.");
      return;
    }

    this.viewBusyCount++;
    try {
      await this._orm.connectAsync(MainDbContext, async db => {
        // 변경 된 값이 있을 경우
        for (const diffTarget of diffTargets) {
          for (const repairItem of diffTarget!.repairList || []) {
            // id가 없으면 추가 된 항목 => insert처리
            if (!repairItem!.id) {
              const newItem = await db.repairByEquipment
                .insertAsync({
                  companyId: this._appData.authInfo!.companyId,
                  equipmentId: diffTarget.id!,
                  dueDate: repairItem.repairDate!,
                  remark: repairItem.remark,
                  result: repairItem.result,
                  price: repairItem.price,
                  createdByEmployeeId: this._appData.authInfo!.employeeId,
                  createdAtDateTime: new DateTime()
                });
              //insert 후 반환 된 값을 기존 list에 바인딩
              repairItem.id = newItem.id;
              repairItem.createdByEmployeeName = this._appData.authInfo!.employeeName;
              repairItem.createdAtDateTime = new DateTime();

            }
            // id가 이미 있는경우 => updqte처리
            else {
              await db.repairByEquipment
                .where(item => [
                  sorm.equal(item.id, repairItem.id)
                ])
                .updateAsync(
                  () => ({
                    remark: repairItem.remark,
                    result: repairItem.result,
                    price: repairItem.price
                  })
                );
            }
          }
        }
      });

      // this.orgItems 객체를 수정 된 this.items로 변경
      this.orgItems = Object.clone(this.items);
      this._toast.success("저장되었습니다.");

    } catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }

    this.viewBusyCount--;
  }

  private async _search(): Promise<void> {
    if (!this.lastFilter) return;

    this.mainBusyCount++;
    try {
      await this._orm.connectAsync(MainDbContext, async db => {
        const queryable = this._getSearchQueryable(db);

        this.items = await queryable
          .include(item => item.repair)
          .include(item => item.repair![0].employee)
          .select(item => ({
            id: item.id,
            name: item.name,
            code: item.code,
            isCount: item.isCount,
            seq: item.seq,
            isDisabled: item.isDisabled,

            repairList: item.repair && item.repair.map(item1 => ({
              id: item1.id,
              repairDate: item1.dueDate,
              remark: item1.remark,
              result: item1.result,
              price: item1.price,
              createdByEmployeeId: item1.createdByEmployeeId,
              createdByEmployeeName: item1.employee!.name,
              createdAtDateTime: item1.createdAtDateTime
            }))
          }))
          .orderBy(item => item.seq)
          .limit(this.pagination.page * 50, 50)
          .wrap()
          .resultAsync();
        this.orgItems = Object.clone(this.items);


        console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
        console.log(this.items);
        console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");

        const totalCount = await queryable.countAsync();
        this.pagination.length = Math.ceil(totalCount / 50);
      });
    } catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }

    this.mainBusyCount--;
  }

  private _getSearchQueryable(db: MainDbContext): Queryable<Equipment> {
    let queryable = db.equipment
      .where(item => [
        sorm.equal(item.companyId, this._appData.authInfo!.companyId)
      ]);

    if (this.lastFilter!.equipmentCode) {
      queryable = queryable.where(item => [
        sorm.includes(item.code, this.lastFilter!.equipmentCode)
      ]);
    }

    if (this.lastFilter!.equipmentName) {
      queryable = queryable.where(item => [
        sorm.includes(item.name, this.lastFilter!.equipmentName)
      ]);
    }

    if (this.lastFilter!.isDisabled !== false) {
      queryable = queryable.where(item => [
        sorm.notEqual(item.isDisabled, true)
      ]);
    }


    return queryable;
  }
}

interface IFilterVM {
  equipmentName?: string;
  equipmentCode?: string;
  isCount: boolean;
  isDisabled: boolean;
}

interface IEquipmentVM {
  id: number | undefined;
  name: string | undefined;
  code: string | undefined;
  isCount: boolean | undefined;
  seq: number | undefined;
  isDisabled: boolean | undefined;

  repairList: IEquipmentRepairItemVM[] | undefined;
}

interface IEquipmentRepairItemVM {
  id: number | undefined;
  repairDate: DateOnly | undefined;
  remark: string | undefined;
  result: string | undefined;
  price: string | undefined;
  createdByEmployeeId: number | undefined;
  createdByEmployeeName: string | undefined;
  createdAtDateTime: DateTime | undefined;
}