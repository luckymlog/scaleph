import {Dict, ModalFormProps} from '@/app.d';
import {FlinkRelease, FlinkReleaseUploadParam} from '@/services/resource/typings';
import {Button, Form, Input, message, Modal, Select, Upload, UploadFile, UploadProps} from 'antd';
import {useIntl} from 'umi';
import {useEffect, useState} from "react";
import {UploadOutlined} from "@ant-design/icons";
import {upload} from "@/services/resource/flinkRelease.service";
import {listDictDataByType} from "@/services/admin/dictData.service";
import {DICT_TYPE} from "@/constant";

const FlinkReleaseForm: React.FC<ModalFormProps<FlinkRelease>> = ({
  data,
  visible,
  onVisibleChange,
  onCancel,
}) => {
  const intl = useIntl();
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [flinkVersionList, setFlinkVersionList] = useState<Dict[]>([]);
  useEffect(() => {
    listDictDataByType(DICT_TYPE.flinkVersion).then((d) => {
      setFlinkVersionList(d);
    });
  }, []);

  const props: UploadProps = {
    multiple: false,
    maxCount: 1,
    onRemove: file => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    },
    beforeUpload: file => {
      setFileList([...fileList, file]);
      return false;
    },
    fileList,
  };

  return (
    <Modal
      visible={visible}
      title={
        data.id
          ? intl.formatMessage({ id: 'app.common.operate.edit.label' }) +
            intl.formatMessage({ id: 'pages.resource.flinkRelease' })
          : intl.formatMessage({ id: 'app.common.operate.upload.label' }) +
            intl.formatMessage({ id: 'pages.resource.flinkRelease' })
      }
      width={580}
      destroyOnClose={true}
      onCancel={onCancel}
      confirmLoading={uploading}
      okText={uploading ? intl.formatMessage({ id: 'app.common.operate.uploading.label' }) : intl.formatMessage({ id: 'app.common.operate.upload.label' })}
      onOk={() => {
        form.validateFields().then((values) => {
          const uploadParam: FlinkReleaseUploadParam  ={
            version: values.version,
            file: fileList[0],
            remark: values.remark
          };
          setUploading(true);
          upload(uploadParam)
            .then((response) => {
              if (response.success) {
                setFileList([]);
                message.success(intl.formatMessage({ id: 'app.common.operate.upload.success' }));
              }
            })
            .catch(() => {
              message.error(intl.formatMessage({ id: 'app.common.operate.upload.failure' }));
            })
            .finally(() => {
              setUploading(false);
              onVisibleChange(false);
            });
        });
      }}
    >
      <Form form={form} layout="horizontal" labelCol={{ span: 6 }} wrapperCol={{ span: 16 }}>
        <Form.Item name="id" hidden>
          <Input></Input>
        </Form.Item>
        <Form.Item
          name="version"
          label={intl.formatMessage({ id: 'pages.resource.flinkRelease.version' })}
          rules={[{ required: true }]}
        >
          <Select
            disabled={data.id ? true : false}
            showSearch={true}
            allowClear={true}
            optionFilterProp="label"
            filterOption={(input, option) =>
              (option!.children as unknown as string)
                .toLowerCase()
                .includes(input.toLowerCase())
            }
          >
            {flinkVersionList.map((item) => {
              return (
                <Select.Option key={item.value} value={item.value}>
                  {item.label}
                </Select.Option>
              );
            })}
          </Select>
        </Form.Item>
        <Form.Item
          label={intl.formatMessage({ id: 'pages.resource.file' })}
          rules={[{ required: true }]}
        >
          <Upload {...props}>
            <Button icon={<UploadOutlined />}>{intl.formatMessage({ id: 'pages.resource.flinkRelease.file' })}</Button>
          </Upload>
        </Form.Item>
        <Form.Item
          name="remark"
          label={intl.formatMessage({ id: 'pages.resource.remark' })}
          rules={[{ max: 200 }]}
        >
          <Input></Input>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default FlinkReleaseForm;
