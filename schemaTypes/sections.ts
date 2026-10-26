import {defineArrayMember, defineField, defineType} from 'sanity'

export const sections = defineType({
  name: 'section',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string'}),
    defineField({
      name: 'parent',
      type: 'reference',
      to: [{type: 'section'}],
    }),
    defineField({
      name: 'products',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'product'}]})],
    }),
  ],
})

export const contentSections = defineType({
  name: 'contentSection',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string'}),
    defineField({
      name: 'content',
      type: 'array',
      of: [defineArrayMember({type: 'block'})],
    }),
    defineField({name: 'section', type: 'reference', to: {type: 'section'}}),
    defineField({name: 'market', type: 'reference', to: {type: 'market'}}),
  ],
})
