import {AfterContentInit, Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {DValidateRules, FormLayout} from 'ng-devui';
import {
  FlinkClusterConfig,
  KeyValueConfig
} from "../../../../@core/data/flink.data";
import {ClusterCredentialService} from "../../../../@core/services/resource/cluster-credential.service";
import {DEFAULT_PAGE_PARAM, Dict, DICT_TYPE, PageResponse} from "../../../../@core/data/app.data";
import {SysDictDataService} from "../../../../@core/services/admin/dict-data.service";
import {ClusterConfigService} from "../../../../@core/services/flink/cluster-config.service";
import {DataTableComponent} from "@devui";
import {FlinkReleaseService} from "../../../../@core/services/resource/flink-release.service";
import {
  ClusterCredential,
  ClusterCredentialParam,
  FlinkRelease,
  FlinkReleaseParam
} from "../../../../@core/data/resource.data";

@Component({
  selector: 'app-cluster-config-new',
  templateUrl: './cluster-config-new.component.html',
  styleUrls: ['../cluster-config.component.scss'],
})
export class ClusterConfigNewComponent implements OnInit, AfterContentInit {
  parent: HTMLElement;
  @Input() data: any;
  @ViewChild('dataTable', {static: true}) dataTable: DataTableComponent;
  formLayout = FormLayout.Horizontal;
  formConfig: { [Key: string]: DValidateRules } = {
    rule: {message: this.translate.instant('app.error.formValidateError'), messageShowType: 'text'},
    flinkVersionRules: {
      validators: [{required: true}],
    },
    resourceProviderRules: {
      validators: [{required: true}],
    },
    deployModeRules: {
      validators: [{required: true}],
    },
    flinkReleaseRules: {
      validators: [{required: true}],
    },
    flinkDeployConfigRules: {
      validators: [{required: true}],
    },
    nameRules: {
      validators: [{required: true}],
    },
    remarkRules: {
      validators: [{maxlength: 200}],
    },
  };

  flinkVersionList: Dict[] = []
  resourceProviderList: Dict[] = []
  deployModeList: Dict[] = []
  flinkReleaseList: FlinkRelease[] = []
  flinkDeployConfigList: ClusterCredential[] = []

  flinkDeployConfigResult: PageResponse<ClusterCredential> = null

  formData = {
    flinkVersion: null,
    resourceProvider: null,
    deployMode: null,
    flinkRelease: null,
    flinkDeployConfig: null,
    name: null,
    remark: null,
  };

  headerNewForm: boolean = false;
  customConfigdataTableDs: Array<KeyValueConfig> = []
  defaultRowData = {
    key: null,
    value: null
  }

  constructor(
    private elr: ElementRef,
    private translate: TranslateService,
    private dictDataService: SysDictDataService,
    private releaseFlinkService: FlinkReleaseService,
    private deployConfigService: ClusterCredentialService,
    private clusterConfigService: ClusterConfigService) {
  }

  ngOnInit(): void {
    this.parent = this.elr.nativeElement.parentElement;
    this.dictDataService.listByType(DICT_TYPE.flinkVersion).subscribe((d) => {
      this.flinkVersionList = d;
    });
    this.dictDataService.listByType(DICT_TYPE.flinkResourceProvider).subscribe((d) => {
      this.resourceProviderList = d;
    });
    this.dictDataService.listByType(DICT_TYPE.flinkDeploymentMode).subscribe((d) => {
      this.deployModeList = d;
    });

    let flinkDeployConfigParam: ClusterCredentialParam = {
      pageSize: DEFAULT_PAGE_PARAM.pageSize,
      current: DEFAULT_PAGE_PARAM.pageIndex
    }
    this.deployConfigService.list(flinkDeployConfigParam).subscribe((d) => {
      this.flinkDeployConfigResult = d
      this.flinkDeployConfigList = d.records;
    });
  }

  ngAfterContentInit() {
  }

  onFlinkVersionValueChange(flinkVersion) {
    this.formData.flinkRelease = null
    let param: FlinkReleaseParam = {
      version: flinkVersion.value,
    };

    this.releaseFlinkService.list(param).subscribe((d) => {
      this.flinkReleaseList = d.records;
    });
  }

  onFlinkDeployConfigLoadMore(event) {
    let loaded = this.flinkDeployConfigResult.current * this.flinkDeployConfigResult.size
    if (loaded >= this.flinkDeployConfigResult.total) {
      event.instance.loadFinish();
    } else {
      let flinkDeployConfigParam: ClusterCredentialParam = {
        pageSize: this.flinkDeployConfigResult.size,
        current: this.flinkDeployConfigResult.current + 1
      }
      this.deployConfigService.list(flinkDeployConfigParam).subscribe((d) => {
        this.flinkDeployConfigResult = d
        this.flinkDeployConfigList = [...this.flinkDeployConfigList, ...d.records];
        event.instance.loadFinish();
      });
    }
  }

  newRow() {
    this.headerNewForm = true;
  }

  quickRowAdded() {
    const newData = {...this.defaultRowData};
    this.customConfigdataTableDs.unshift(newData);
    this.headerNewForm = false;
    this.defaultRowData = {
      key: null,
      value: null
    }
  }

  quickRowCancel() {
    this.headerNewForm = false;
  }

  deleteRow(rowIndex) {
    this.customConfigdataTableDs.splice(rowIndex, 1);
  }

  submitForm({valid}) {
    let customConfigOptions: { [key: string]: any } = {};
    this.customConfigdataTableDs.forEach((config) => {
      customConfigOptions[config.key] = config.value
    })

    let row: FlinkClusterConfig = {
      name: this.formData.name,
      flinkVersion: this.formData.flinkVersion,
      resourceProvider: this.formData.resourceProvider,
      deployMode: this.formData.deployMode,
      flinkRelease: this.formData.flinkRelease,
      clusterCredential: this.formData.flinkDeployConfig,
      configOptions: customConfigOptions,
      remark: this.formData.remark
    };

    if (valid) {
      this.clusterConfigService.add(row).subscribe((d) => {
        if (d.success) {
          this.data.onClose();
          this.data.refresh();
        }
      });
    }
  }

  close(event) {
    this.data.onClose(event);
  }
}
