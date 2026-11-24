-- Guard: stop before writing anything if a stored value has a form this migration does not know
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "flight_cargo_shipment"
    WHERE "dangerousGoods" ? 'netPerPackage'
      AND "dangerousGoods"->>'netPerPackage' !~ '^[0-9]+(\.[0-9]+)? (kg|L|mL|TBq|unit)$'
  ) THEN
    RAISE EXCEPTION 'a stored net quantity per package has an unknown form';
  END IF;

  IF EXISTS (
    SELECT 1 FROM "flight_cargo_shipment"
    WHERE "temperatureControl" ? 'explanation'
      AND "temperatureControl"->>'explanation' !~ '^Exposure of -?[0-9.]+ h exceeds the [0-9.]+ h endurance of (an active container|a dry ice pack|a passive shipper)\.$'
      AND "temperatureControl"->>'explanation' !~ '^-?[0-9]+(\.[0-9]+)? °C at the transfer point exceeds what (an active container|a dry ice pack|a passive shipper) is validated for\.$'
      AND "temperatureControl"->>'explanation' !~ '^An? [0-9]+(\.[0-9]+)? h connection leaves the shipment on (an active container|a dry ice pack|a passive shipper) longer than it should be\.$'
      AND "temperatureControl"->>'explanation' !~ '^(An active container|A dry ice pack|A passive shipper) with -?[0-9.]+ h margin on a [0-9.]+ h endurance(; no cooling available in flight)?\.$'
  ) THEN
    RAISE EXCEPTION 'a stored cold chain explanation has an unknown form';
  END IF;
END $$;

-- Net quantity per package: "5 L" becomes { "amount": 5, "unit": "L" }
UPDATE "flight_cargo_shipment"
SET "dangerousGoods" = ("dangerousGoods" - 'netPerPackage') || jsonb_build_object(
  'netQuantity', jsonb_build_object(
    'amount', split_part("dangerousGoods"->>'netPerPackage', ' ', 1)::numeric,
    'unit', split_part("dangerousGoods"->>'netPerPackage', ' ', 2)
  )
)
WHERE "dangerousGoods" ? 'netPerPackage';

-- Cold chain: the explanation sentence becomes the reason it states, and the constant advisory flag goes
UPDATE "flight_cargo_shipment"
SET "temperatureControl" = ("temperatureControl" - 'explanation' - 'advisory') || jsonb_build_object(
  'reason',
  CASE
    WHEN "temperatureControl"->>'explanation' LIKE 'Exposure of %'
      THEN jsonb_build_object('kind', 'endurance_exceeded')
    WHEN "temperatureControl"->>'explanation' LIKE '% °C at the transfer point %'
      THEN jsonb_build_object(
        'kind', 'hot_transfer',
        'ambientC', substring("temperatureControl"->>'explanation' FROM '^(-?[0-9]+(?:\.[0-9]+)?) °C')::numeric
      )
    WHEN "temperatureControl"->>'explanation' LIKE '% h connection leaves the shipment %'
      THEN jsonb_build_object(
        'kind', 'long_connection',
        'connectionHours', substring("temperatureControl"->>'explanation' FROM '^An? ([0-9]+(?:\.[0-9]+)?) h')::numeric
      )
    WHEN "temperatureControl"->>'explanation' LIKE '%; no cooling available in flight.'
      THEN jsonb_build_object('kind', 'thin_margin')
    ELSE jsonb_build_object('kind', 'within_margin')
  END
)
WHERE "temperatureControl" ? 'explanation';
