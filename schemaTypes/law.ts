import {defineField, defineType} from 'sanity'

export const law = defineType({
  name: 'law',
  title: 'Law',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string'}),
    defineField({name: 'sourceFile', type: 'file'}),
    defineField({name: 'sourceImage', type: 'image'}),
    defineField({name: 'baseText', type: 'array', of: [{type: 'block'}]}),
  ],
})
