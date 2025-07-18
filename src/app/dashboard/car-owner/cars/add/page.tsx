'use client'

import React, { useState, useEffect } from 'react'
import { Card, Form, Input, Button, Select, InputNumber, Row, Col, Typography, Space, message, Divider } from 'antd'
import { CarOutlined, SaveOutlined, ArrowLeftOutlined, SearchOutlined } from '@ant-design/icons'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { MultipleImageUpload } from '@/components/common/MultipleImageUpload'
import { useAuth } from '@/contexts/AuthContext'
import { DatabaseService } from '@/services/database'
import { useRouter } from 'next/navigation'
import { 
  getCarMakes, 
  getModelsByMake, 
  getAvailableYears,
  getCarCategoryLabel,
  CarMake, 
  CarModel 
} from '@/data/carMakesModels'

const { Title, Text } = Typography
const { Option } = Select

export default function AddCarPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [carImages, setCarImages] = useState<string[]>([])
  const [selectedMake, setSelectedMake] = useState<string>('')
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [availableModels, setAvailableModels] = useState<CarModel[]>([])
  const [availableYears, setAvailableYears] = useState<number[]>([])

  const currentYear = new Date().getFullYear()
  const carMakes = getCarMakes()

  // Handle make selection - update available models
  const handleMakeChange = (makeId: string) => {
    setSelectedMake(makeId)
    setSelectedModel('')
    setAvailableYears([])
    
    // Get models for selected make
    const models = getModelsByMake(makeId)
    setAvailableModels(models)
    
    // Clear model and year fields
    form.setFieldsValue({
      model: undefined,
      year: undefined
    })
  }

  // Handle model selection - update available years
  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId)
    
    // Get available years for selected make and model
    const years = getAvailableYears(selectedMake, modelId)
    setAvailableYears(years)
    
    // Clear year field
    form.setFieldsValue({
      year: undefined
    })
  }

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (!user) {
      message.error('You must be logged in to add a car')
      return
    }

    setLoading(true)
    try {
      const carData = {
        owner_id: user.id,
        make: values.make,
        model: values.model,
        year: values.year,
        image_url: carImages[0] || null, // Primary image
        image_urls: carImages, // All images
        // Additional fields - only include if they have values
        ...(values.color && { color: values.color }),
        ...(values.license_plate && { license_plate: values.license_plate }),
        ...(values.vin && { vin: values.vin }),
        ...(values.mileage && { mileage: values.mileage }),
        ...(values.engine_type && { engine_type: values.engine_type }),
        ...(values.transmission && { transmission: values.transmission }),
        ...(values.notes && { notes: values.notes }),
      }

      // Filter out undefined values to prevent Firestore errors
      const cleanedCarData = Object.fromEntries(
        Object.entries(carData).filter(([_, value]) => value !== undefined)
      )

      const carId = await DatabaseService.createCar(cleanedCarData as any)
      
      message.success('Car added successfully!')
      router.push('/dashboard/car-owner/cars')
    } catch (error) {
      console.error('Error adding car:', error)
      message.error('Failed to add car. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleImagesChange = (urls: string[]) => {
    setCarImages(urls)
  }

  const handleImageUpload = (uploadedUrls: string[], primaryIndex: number) => {
    console.log('Image upload completed:', { uploadedUrls, primaryIndex })
    
    // Store the uploaded URLs and primary index
    const primaryUrl = uploadedUrls[primaryIndex] || uploadedUrls[0]
    
    // Set both single image URL (for backward compatibility) and multiple URLs
    form.setFieldsValue({
      image_url: primaryUrl,
      image_urls: uploadedUrls
    })
  }

  const onFinish = async (values: Record<string, unknown>) => {
    // ... existing code ...
  }

  const getFormFieldValue = (field: string): string => {
    const value = form.getFieldValue(field)
    return value || ''
  }

  if (!user) {
    return (
      <DashboardLayout activeKey="cars">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout activeKey="cars">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => router.back()}
            size="large"
          >
            Back
          </Button>
          <div>
            <Title level={2}>Add New Car</Title>
            <Text type="secondary">
              Enter your vehicle information to start tracking maintenance
            </Text>
          </div>
        </div>

        <Card>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            className="space-y-4"
            initialValues={{
              year: currentYear,
            }}
          >
            {/* Basic Information */}
            <div>
              <Title level={4}>Basic Information</Title>
              <Divider />
              
              <Row gutter={[16, 0]}>
                <Col xs={24} sm={8}>
                  <Form.Item
                    name="make"
                    label="Make"
                    rules={[{ required: true, message: 'Please select car make' }]}
                  >
                    <Select
                      placeholder="Select car make"
                      size="large"
                      showSearch
                      filterOption={(input, option) =>
                        option?.children?.toString().toLowerCase().includes(input.toLowerCase()) ?? false
                      }
                      onChange={handleMakeChange}
                      suffixIcon={<SearchOutlined />}
                    >
                      {carMakes.map(make => (
                        <Option key={make.id} value={make.id}>
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{make.name}</span>
                            <span className="text-xs text-gray-500">{make.country}</span>
                          </div>
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={8}>
                  <Form.Item
                    name="model"
                    label="Model"
                    rules={[{ required: true, message: 'Please select car model' }]}
                  >
                    <Select
                      placeholder={selectedMake ? "Select model" : "Select make first"}
                      size="large"
                      showSearch
                      disabled={!selectedMake}
                      filterOption={(input, option) =>
                        option?.children?.toString().toLowerCase().includes(input.toLowerCase()) ?? false
                      }
                      onChange={handleModelChange}
                      suffixIcon={<SearchOutlined />}
                      notFoundContent={selectedMake ? "No models found" : "Please select a make first"}
                    >
                      {availableModels.map(model => (
                        <Option key={model.id} value={model.id}>
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{model.name}</span>
                            <span className="text-xs text-gray-500">{getCarCategoryLabel(model.category)}</span>
                          </div>
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={8}>
                  <Form.Item
                    name="year"
                    label="Year"
                    rules={[{ required: true, message: 'Please select year' }]}
                  >
                    <Select
                      placeholder={selectedModel ? "Select year" : "Select model first"}
                      size="large"
                      showSearch
                      disabled={!selectedModel}
                      filterOption={(input, option) =>
                        option?.children?.toString().includes(input) ?? false
                      }
                      notFoundContent={selectedModel ? "No years available" : "Please select a model first"}
                    >
                      {availableYears.map(year => (
                        <Option key={year} value={year}>
                          {year}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </div>

            {/* Additional Details */}
            <div>
              <Title level={4}>Additional Details</Title>
              <Divider />
              
              <Row gutter={[16, 0]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="color"
                    label="Color"
                  >
                    <Input 
                      placeholder="e.g., Red, Blue, Silver"
                      size="large"
                    />
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="license_plate"
                    label="License Plate"
                  >
                    <Input 
                      placeholder="License plate number"
                      size="large"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[16, 0]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="vin"
                    label="VIN (Vehicle Identification Number)"
                  >
                    <Input 
                      placeholder="17-character VIN"
                      size="large"
                      maxLength={17}
                    />
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="mileage"
                    label="Current Mileage"
                  >
                    <InputNumber
                      min={0}
                      placeholder="Miles"
                      size="large"
                      className="w-full"
                      formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={(value: any) => value?.replace(/\$\s?|(,*)/g, '')}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[16, 0]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="engine_type"
                    label="Engine Type"
                  >
                    <Select
                      placeholder="Select engine type"
                      size="large"
                      allowClear
                    >
                      <Option value="gasoline">Gasoline</Option>
                      <Option value="diesel">Diesel</Option>
                      <Option value="hybrid">Hybrid</Option>
                      <Option value="electric">Electric</Option>
                      <Option value="plugin-hybrid">Plug-in Hybrid</Option>
                    </Select>
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="transmission"
                    label="Transmission"
                  >
                    <Select
                      placeholder="Select transmission"
                      size="large"
                      allowClear
                    >
                      <Option value="automatic">Automatic</Option>
                      <Option value="manual">Manual</Option>
                      <Option value="cvt">CVT</Option>
                      <Option value="semi-automatic">Semi-Automatic</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </div>

            {/* Car Images */}
            <div>
              <Title level={4}>Car Photos</Title>
              <Divider />
              
              <Form.Item
                label="Upload car photos (optional)"
                extra="Add multiple photos of your car to help mechanics better understand its condition. First image will be the primary photo."
              >
                <MultipleImageUpload
                  value={carImages}
                  onChange={handleImagesChange}
                  folder="cars"
                  maxCount={5}
                  buttonText="Add Car Photos"
                  className="w-full"
                />
              </Form.Item>
            </div>

            {/* Notes */}
            <div>
              <Title level={4}>Notes</Title>
              <Divider />
              
              <Form.Item
                name="notes"
                label="Additional Notes"
              >
                <Input.TextArea
                  placeholder="Any additional information about your car..."
                  rows={4}
                  size="large"
                />
              </Form.Item>
            </div>

            {/* Submit Buttons */}
            <Form.Item>
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  icon={<SaveOutlined />}
                  size="large"
                >
                  Add Car
                </Button>
                <Button
                  onClick={() => router.back()}
                  size="large"
                >
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </DashboardLayout>
  )
} 