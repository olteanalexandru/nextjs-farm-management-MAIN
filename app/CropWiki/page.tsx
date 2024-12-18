'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Input,
  Select,
  SelectItem,
  Card,
  CardBody,
  Spinner,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  Chip
} from '@nextui-org/react';
import { Crop } from 'app/types/api';
import { 
  Search, 
  SortAsc, 
  SortDesc, 
  Calendar, 
  Sprout,
  Droplet,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const ITEMS_PER_PAGE = 10;

function CropWikiContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    cropType: searchParams.get('cropType') || '',
    soilType: searchParams.get('soilType') || '',
    sortBy: searchParams.get('sortBy') || 'cropName',
    sortOrder: searchParams.get('sortOrder') || 'asc',
    page: parseInt(searchParams.get('page') || '1')
  });

  const fetchCrops = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: filters.page.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.cropType && { cropType: filters.cropType }),
        ...(filters.soilType && { soilType: filters.soilType }),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });

      const response = await fetch(`/api/Controllers/Crop/crops/wiki?${queryParams}`);
      const data = await response.json();
      setCrops(data.crops);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching crops:', error);
      setError('Failed to load crops. Please try again later.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCrops();
    
    // Update URL with current filters
    const queryParams = new URLSearchParams(filters as any);
    router.push(`/CropWiki?${queryParams}`);
  }, [filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset page when filters change
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({
      ...prev,
      page
    }));
  };

  const navigateToCrop = (cropId: string) => {
    router.push(`/Crop/${cropId}`, { scroll: false });
  };

  const toggleSortOrder = () => {
    setFilters(prev => ({
      ...prev,
      sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      cropType: '',
      soilType: '',
      sortBy: 'cropName',
      sortOrder: 'asc',
      page: 1
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-[1400px]">
      {/* Page Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Crop Encyclopedia</h1>
        <p className="text-gray-600">
          Explore our comprehensive database of crops, their characteristics, and growing requirements
        </p>
      </div>

      {/* Filters Section */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search crops..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10 min-w-0"
              size="lg"
            />
          </div>
          
          <Select
            placeholder="Crop Type"
            selectedKeys={filters.cropType ? [filters.cropType] : []}
            onChange={(e) => handleFilterChange('cropType', e.target.value)}
            startContent={<Sprout className="text-gray-400" />}
            className="min-w-0"
            size="lg"
          >
            <SelectItem key="VEGETABLE">Vegetable</SelectItem>
            <SelectItem key="FRUIT">Fruit</SelectItem>
            <SelectItem key="GRAIN">Grain</SelectItem>
            <SelectItem key="LEGUME">Legume</SelectItem>
            <SelectItem key="ROOT">Root Crop</SelectItem>
          </Select>

          <Select
            placeholder="Soil Type"
            selectedKeys={filters.soilType ? [filters.soilType] : []}
            onChange={(e) => handleFilterChange('soilType', e.target.value)}
            startContent={<Droplet className="text-gray-400" />}
            className="min-w-0"
            size="lg"
          >
            <SelectItem key="CLAY">Clay</SelectItem>
            <SelectItem key="LOAM">Loam</SelectItem>
            <SelectItem key="SANDY">Sandy</SelectItem>
            <SelectItem key="SILT">Silt</SelectItem>
          </Select>

          <div className="flex gap-2">
            <Dropdown>
              <DropdownTrigger>
                <Button 
                  variant="flat" 
                  size="lg"
                  className="flex-1 min-w-0"
                >
                  Sort By: {filters.sortBy}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                onAction={(key) => handleFilterChange('sortBy', String(key))}
              >
                <DropdownItem key="cropName">Name</DropdownItem>
                <DropdownItem key="cropType">Type</DropdownItem>
                <DropdownItem key="soilType">Soil Type</DropdownItem>
                <DropdownItem key="createdAt">Date Added</DropdownItem>
              </DropdownMenu>
            </Dropdown>
            <Button
              isIconOnly
              variant="flat"
              size="lg"
              onClick={toggleSortOrder}
            >
              {filters.sortOrder === 'asc' ? <SortAsc /> : <SortDesc />}
            </Button>
            <Button
              isIconOnly
              variant="flat"
              size="lg"
              onClick={resetFilters}
              className="bg-default-100"
            >
              <RefreshCw className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Add active filters display */}
      {(filters.search || filters.cropType || filters.soilType) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {filters.search && (
            <Chip
              onClose={() => handleFilterChange('search', '')}
              variant="flat"
            >
              Search: {filters.search}
            </Chip>
          )}
          {filters.cropType && (
            <Chip
              onClose={() => handleFilterChange('cropType', '')}
              variant="flat"
            >
              Type: {filters.cropType}
            </Chip>
          )}
          {filters.soilType && (
            <Chip
              onClose={() => handleFilterChange('soilType', '')}
              variant="flat"
            >
              Soil: {filters.soilType}
            </Chip>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="text-red-500 text-center mb-4">
          {error}
        </div>
      )}

      {/* Content Section */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Spinner size="lg" />
          <p className="text-gray-500 mt-4">Loading crops...</p>
        </div>
      ) : crops.length === 0 ? (
        <div className="text-center py-12">
          <Sprout className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No crops found</h3>
          <p className="text-gray-500">Try adjusting your filters or search term</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {crops.map((crop) => (
            <Card
              key={crop._id}
              isPressable
              onPress={() => crop._id && navigateToCrop(crop._id.toString())}
              className="hover:shadow-lg transition-shadow w-full"
            >
              <CardBody className="p-4">
                {crop.imageUrl && (
                  <div className="relative w-full pt-[60%] mb-4">
                    <img
                      src={crop.imageUrl}
                      alt={crop.cropName}
                      className="rounded-lg object-cover absolute top-0 left-0 w-full h-full"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <h4 className="text-xl font-semibold">{crop.cropName}</h4>
                  <div className="flex flex-wrap gap-2">
                    <Chip size="sm" color="primary">{crop.cropType}</Chip>
                    <Chip size="sm" color="secondary">{crop.soilType}</Chip>
                  </div>
                  {crop.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {crop.description}
                    </p>
                  )}
                  {(crop.plantingDate || crop.harvestingDate) && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(crop.plantingDate || '').toLocaleDateString()} 
                        {crop.harvestingDate && ` - ${new Date(crop.harvestingDate).toLocaleDateString()}`}
                      </span>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && crops.length > 0 && (
        <div className="mt-8 flex justify-center items-center gap-2">
          <Button
            isIconOnly
            size="lg"
            variant="flat"
            isDisabled={filters.page === 1}
            onClick={() => handlePageChange(filters.page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-2">
            <span className="text-sm">
              Page {filters.page} of {totalPages}
            </span>
          </div>

          <Button
            isIconOnly
            size="lg"
            variant="flat"
            isDisabled={filters.page >= totalPages}
            onClick={() => handlePageChange(filters.page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

// Wrap the main component with Suspense
export default function CropWiki() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
        <p className="text-gray-500 mt-4">Loading...</p>
      </div>
    }>
      <CropWikiContent />
    </Suspense>
  );
}
