import { DataSource } from 'typeorm';

import { ProductCategory } from '../../modules/products/entities/product-category.entity';

export async function seedCategories(dataSource: DataSource) {
  const categoriesRepository = dataSource.getRepository(ProductCategory);

  const categories = [
    {
      name: 'Honey',
    },

    {
      name: 'Powder',
    },

    {
      name: 'Crunchies',
    },

    {
      name: 'Wax',
    },
  ];

  for (const category of categories) {
    const exists = await categoriesRepository.findOne({
      where: {
        name: category.name,
      },
    });

    if (!exists) {
      const newCategory = categoriesRepository.create(category);

      await categoriesRepository.save(newCategory);
    }
  }

  console.log('Categories seeded successfully');
}
