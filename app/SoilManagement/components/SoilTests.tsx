'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { observer } from 'mobx-react';
import { Form, Input, Button, Table, Select, DatePicker, Alert, Modal } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useSoilTests } from '../../providers/soilTestStore';
import LoadingSpinner from '../../components/LoadingSpinner';
import styles from './SoilTests.module.scss';

interface SoilTest {
  id: number;
  testDate: string;
  fieldLocation: string;
  pH: number;
  organicMatter: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  texture: string;
  notes?: string;
}

interface SoilTestFormData {
  testDate: string;
  fieldLocation: string;
  pH: string;
  organicMatter: string;
  nitrogen: string;
  phosphorus: string;
  potassium: string;
  texture: string;
  notes?: string;
}

const SoilTests = observer(() => {
  const t = useTranslations('SoilManagement');
  const [form] = Form.useForm();
  const soilTestStore = useSoilTests();

  useEffect(() => {
    soilTestStore.fetchSoilTests();
  }, [soilTestStore]);

  const handleSubmit = async (values: any) => {
    const formData: SoilTestFormData = {
      testDate: values.testDate.format('YYYY-MM-DD'),
      fieldLocation: values.fieldLocation,
      pH: values.pH.toString(),
      organicMatter: values.organicMatter.toString(),
      nitrogen: values.nitrogen.toString(),
      phosphorus: values.phosphorus.toString(),
      potassium: values.potassium.toString(),
      texture: values.texture,
      notes: values.notes,
    };

    try {
      await soilTestStore.saveSoilTest(null, formData);
      form.resetFields();
    } catch (error) {
      console.error('Failed to save soil test:', error);
    }
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: t('confirmDelete'),
      onOk: async () => {
        try {
          await soilTestStore.deleteSoilTest(id);
        } catch (error) {
          console.error('Failed to delete soil test:', error);
        }
      },
    });
  };

  const columns = [
    {
      title: t('testDate'),
      dataIndex: 'testDate',
      key: 'testDate',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: t('fieldLocation'),
      dataIndex: 'fieldLocation',
      key: 'fieldLocation',
    },
    {
      title: t('pH'),
      dataIndex: 'pH',
      key: 'pH',
    },
    {
      title: t('organicMatter'),
      dataIndex: 'organicMatter',
      key: 'organicMatter',
      render: (value: number) => `${value}%`,
    },
    {
      title: 'NPK',
      key: 'npk',
      render: (_: any, record: SoilTest) => (
        `${record.nitrogen}/${record.phosphorus}/${record.potassium}`
      ),
    },
    {
      title: t('texture'),
      dataIndex: 'texture',
      key: 'texture',
    },
    {
      title: t('actions'),
      key: 'actions',
      render: (_: any, record: SoilTest) => (
        <div className={styles.actions}>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => {
              form.setFieldsValue({
                ...record,
                testDate: dayjs(record.testDate),
              });
            }}
          />
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          />
        </div>
      ),
    },
  ];

  if (soilTestStore.loading) return <LoadingSpinner />;

  return (
    <div className={styles.soilTests}>
      {soilTestStore.error && (
        <Alert type="error" message={soilTestStore.error} showIcon />
      )}

      <div className={styles.header}>
        <h2>{t('soilTests')}</h2>
        <Button type="primary" onClick={() => form.resetFields()}>
          {t('addNewTest')}
        </Button>
      </div>

      <Form
        form={form}
        onFinish={handleSubmit}
        layout="vertical"
      >
        <div className={styles.formGrid}>
          <Form.Item
            name="testDate"
            label={t('testDate')}
            rules={[{ required: true }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="fieldLocation"
            label={t('fieldLocation')}
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="pH"
            label={t('pH')}
            rules={[{ required: true }]}
          >
            <Input type="number" step="0.1" />
          </Form.Item>

          <Form.Item
            name="organicMatter"
            label={t('organicMatter')}
            rules={[{ required: true }]}
          >
            <Input type="number" step="0.01" />
          </Form.Item>

          <Form.Item
            name="nitrogen"
            label={t('nitrogen')}
            rules={[{ required: true }]}
          >
            <Input type="number" step="0.01" />
          </Form.Item>

          <Form.Item
            name="phosphorus"
            label={t('phosphorus')}
            rules={[{ required: true }]}
          >
            <Input type="number" step="0.01" />
          </Form.Item>

          <Form.Item
            name="potassium"
            label={t('potassium')}
            rules={[{ required: true }]}
          >
            <Input type="number" step="0.01" />
          </Form.Item>

          <Form.Item
            name="texture"
            label={t('texture')}
            rules={[{ required: true }]}
          >
            <Select>
              <Select.Option value="Sandy">{t('sandy')}</Select.Option>
              <Select.Option value="Loamy">{t('loamy')}</Select.Option>
              <Select.Option value="Clay">{t('clay')}</Select.Option>
              <Select.Option value="Silt">{t('silt')}</Select.Option>
              <Select.Option value="Sandy Loam">{t('sandyLoam')}</Select.Option>
              <Select.Option value="Clay Loam">{t('clayLoam')}</Select.Option>
              <Select.Option value="Silt Loam">{t('siltLoam')}</Select.Option>
            </Select>
          </Form.Item>
        </div>

        <Form.Item
          name="notes"
          label={t('notes')}
        >
          <Input.TextArea rows={3} />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit">
            {form.getFieldValue('id') ? t('updateTest') : t('addTest')}
          </Button>
        </Form.Item>
      </Form>

      <Table
        columns={columns}
        dataSource={soilTestStore.soilTests}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
});

export default SoilTests;
