import {defineField, defineType} from 'sanity'

export const exportHistory = defineType({
  name: 'exportHistory',
  title: 'Export History',
  type: 'document',
  fields: [
    defineField({
      name: 'product',
      type: 'reference',
      to: [{type: 'product'}],
      validation: (rule) => rule.required().error('Product is required'),
    }),
    defineField({
      name: 'market',
      type: 'reference',
      to: [{type: 'market'}],
      validation: (rule) => rule.required().error('Market is required'),
    }),
    defineField({
      name: 'exportedAt',
      type: 'datetime',
      validation: (rule) => rule.required().error('Export date is required'),
    }),
    defineField({
      name: 'file',
      type: 'file',
      options: {accept: 'application/json'},
      validation: (rule) => rule.required().error('Exported file is required'),
    }),
  ],
  preview: {
    select: {
      productTitle: 'product.title',
      marketTitle: 'market.title',
      exportedAt: 'exportedAt',
    },
    prepare({productTitle, marketTitle, exportedAt}) {
      return {
        title: `${productTitle || 'Product'} · ${marketTitle || 'Market'}`,
        subtitle: exportedAt ? new Date(exportedAt).toLocaleString() : 'No date',
      }
    },
  },
})
