# Usage Examples

See # Convert Sample Tests

# Writing

Below, wee saw a definition of file

```
{
  '1': [
    {name: 'id', init: 1, len: 3, type: FORMAT.NUMBER},
    {name: 'date', init: 4, len: 8, type: FORMAT.DATE}
  ],
  '2': [
    {name: 'id', init: 1, len: 3, type: FORMAT.TEXT},
    {name: 'date', init: 4, len: 8, type: FORMAT.NUMBER}
  ]
}
```

This object

{
	'1': [
		{
			id: 10,
			date: '21'
		}
	],
	'2': [
		{
			id: 10,
			date: '21'
		},
		{
			id: 10,
			date: '21'
		}
	]
}

TODO: This format is a litle different from READER, we need to refactor de READER