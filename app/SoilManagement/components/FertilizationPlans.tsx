'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { observer } from 'mobx-react';
import { Form, Input, Button, Table, Select, DatePicker, Alert, Modal, Tag, Space } from 'antd';
import { EditOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useFertilizationPlans } from '../../providers/fertilizationPlanStore';
import LoadingSpinner from '../../components/LoadingSpinner';
import styles from './FertilizationPlans.module.scss';

interface Crop {
  id: number;
  cropName: string;
}

interface FertilizationPlan {
  id: number;
  plannedDate: string;
  fertilizer: string;
  applicationRate: number;
  nitrogenContent: number;
  applicationMethod: string;
  notes?: string;
  completed: boolean;
  completedDate?: string;
  crop: Crop;
}

interface FertilizationPlanFormData {
  cropId: string;
  plannedDate: string;
  fertilizer: string;
  applicationRate: string;
  nitrogenContent: string;
  applicationMethod: string;
  notes?: string;
}

const FertilizationPlans = observer(() => {
  const t = useTranslations('SoilManagement');
  const [form] = Form.useForm();
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<FertilizationPlan | null>(null);
  const fertilizationStore = useFertilizationPlans();

  useEffect(() => {
    fertilizationStore.fetchFertilizationPlans();
    fertilizationStore.fetchCrops();
  }, [fertilizationStore]);

  const handleSubmit = async (values: any) => {
    const formData: FertilizationPlanFormData = {
      cropId: values.cropId,
      plannedDate: values.plannedDate.format('YYYY-MM-DD'),
      fertilizer: values.fertilizer,
      applicationRate: values.applicationRate.toString(),
      nitrogenContent: values.nitrogenContent.toString(),
      applicationMethod: values.applicationMethod,
      notes: values.notes,
    };

    try {
      await fertilizationStore.saveFertilizationPlan(editingPlan, formData);
      setShowForm(false);
      setEditingPlan(null);
      form.resetFields();
    } catch (error) {
      console.error('Failed to save fertilization plan:', error);
    }
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: t('confirmDelete'),
      onOk: async () => {
        try {
          await fertilizationStore.deleteFertilizationPlan(id);
        } catch (error) {
          console.error('Failed to delete fertilization plan:', error);
        }
      },
    });
  };

  const handleEdit = (plan: FertilizationPlan) => {
    setEditingPlan(plan);
    form.setFieldsValue({
      cropId: plan.crop.id.toString(),
      plannedDate: dayjs(plan.plannedDate),
      fertilizer: plan.fertilizer,
      applicationRate: plan.applicationRate,
      nitrogenContent: plan.nitrogenContent,
      applicationMethod: plan.applicationMethod,
      notes: plan.notes,
    });
    setShowForm(true);
  };

  const handleComplete = async (id: number) => {
    try {
      await fertilizationStore.updateFertilizationPlan(id, {
        completed: true,
        completedDate: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to complete fertilization plan:', error);
    }
  };

  const columns = [
    {
      title: t('plannedDate'),
      dataIndex: 'plannedDate',
      key: 'plannedDate',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: t('crop'),
      dataIndex: ['crop', 'cropName'],
      key: 'crop',
    },
    {
      title: t('fertilizer'),
      dataIndex: 'fertilizer',
      key: 'fertilizer',
    },
    {
      title: t('applicationRate'),
      dataIndex: 'applicationRate',
      key: 'applicationRate',
      render: (rate: number) => `${rate} kg/ha`,
    },
    {
      title: t('nitrogenContent'),
      dataIndex: 'nitrogenContent',
      key: 'nitrogenContent',
      render: (content: number) => `${content}%`,
    },
    {
      title: t('applicationMethod'),
      dataIndex: 'applicationMethod',
      key: 'applicationMethod',
    },
    {
      title: t('status'),
      key: 'status',
      render: (_: any, record: FertilizationPlan) => (
        <Tag color={record.completed ? 'success' : 'warning'}>
          {record.completed ? t('completed') : t('pending')}
          {record.completedDate && ` (${dayjs(record.completedDate).format('YYYY-MM-DD')})`}
        </Tag>
      ),
    },
    {
      title: t('actions'),
      key: 'actions',
      render: (_: any, record: FertilizationPlan) => (
        <Space>
          {!record.completed && (
            <>
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              />
              <Button
                type="link"
                icon={<CheckOutlined />}
                onClick={() => handleComplete(record.id)}
              />
            </>
          )}
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      ),
    },
  ];

  if (fertilizationStore.loading) return <LoadingSpinner />;

  return (
    <div className={styles.fertilizationPlans}>
      {fertilizationStore.error && (
        <Alert type="error" message={fertilizationStore.error} showIcon />
      )}

      <div className={styles.header}>
        <h2>{t('fertilizationPlans')}</h2>
        <Button
          type="primary"
          onClick={() => {
            setShowForm(!showForm);
            setEditingPlan(null);
            form.resetFields();
          }}
        >
          {showForm ? t('cancel') : t('addNewPlan')}
        </Button>
      </div>

      {showForm && (
        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
        >
          <div className={styles.formGrid}>
            <Form.Item
              name="cropId"
              label={t('crop')}
              rules={[{ required: true }]}
            >
              <Select placeholder={t('selectCrop')}>
                {fertilizationStore.crops?.map((crop) => (
                  <Select.Option key={crop.id} value={crop.id.toString()}>
                    {crop.cropName}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="plannedDate"
              label={t('plannedDate')}
              rules={[{ required: true }]}
            >
              <DatePicker />
            </Form.Item>

            <Form.Item
              name="fertilizer"
              label={t('fertilizer')}
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="applicationRate"
              label={t('applicationRate')}
              rules={[{ required: true }]}
            >
              <Input type="number" step="0.01" />
            </Form.Item>

            <Form.Item
              name="nitrogenContent"
              label={t('nitrogenContent')}
              rules={[{ required: true }]}
            >
              <Input type="number" step="0.01" />
            </Form.Item>

            <Form.Item
              name="applicationMethod"
              label={t('applicationMethod')}
              rules={[{ required: true }]}
            >
              <Select placeholder={t('selectMethod')}>
                <Select.Option value="Broadcast">{t('broadcast')}</Select.Option>
                <Select.Option value="Band">{t('band')}</Select.Option>
                <Select.Option value="Foliar">{t('foliar')}</Select.Option>
                <Select.Option value="Fertigation">{t('fertigation')}</Select.Option>
                <Select.Option value="Injection">{t('injection')}</Select.Option>
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
              {editingPlan ? t('updatePlan') : t('addPlan')}
            </Button>
          </Form.Item>
        </Form>
      )}

      <Table
        columns={columns}
        dataSource={fertilizationStore.plans}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
});

export default FertilizationPlans;
