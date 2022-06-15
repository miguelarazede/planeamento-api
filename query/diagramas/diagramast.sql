SET NOCOUNT ON

-- declare @ref varchar(25) = 'R01007.N00000'

declare @tabela table (ststamp varchar(25), ref varchar(30), design varchar(60), nivel int, ststamppai varchar(25), familia varchar(10), origem varchar(36), destino varchar(36), tipo varchar(50))

declare @newid varchar(36) = NEWID()

insert into @tabela
select st.ststamp, st.ref, st.design, 0, '', st.familia, '', @newid, 'PAI'
from st
where ref = @ref

insert into @tabela
select st.ststamp, st.ref, st.design, 1, sc.ststamp, st.familia, @newid, NEWID(), 'FILHO'
from st
	inner join sc on st.ref = sc.ref
where sc.refb = @ref

declare @origem varchar(36), @refsc varchar(18)

declare @bloco int = 2

WHILE @bloco <= 20
BEGIN
	declare @nivel int = @bloco
	declare cursorDados cursor for
	select destino, ref from @tabela where nivel = @nivel - 1
	open cursorDados
	fetch next from cursorDados into @origem, @refsc
	WHILE @@FETCH_STATUS = 0
	BEGIN
		insert into @tabela
		select st.ststamp, st.ref, st.design, @nivel, sc.ststamp, st.familia,@origem, NEWID(), 'FILHO'
		from st
			inner join sc on st.ref = sc.ref
		where sc.refb = @refsc

		fetch next from cursorDados into @origem, @refsc
	END
	close cursorDados
	deallocate cursorDados
	set @bloco = @bloco + 1
END

-- GAMAS
declare @tabela2 table (ststamp varchar(25), ref varchar(30), design varchar(60), nivel int, ststamppai varchar(25), familia varchar(10), origem varchar(36), destino varchar(36), tipo varchar(50))
declare @ststamp varchar(25), @stampgama varchar(36), @stampgamaorigem varchar(36) = ''
declare cursorDados cursor for
select destino, ststamp from @tabela
open cursorDados
fetch next from cursorDados into @origem, @ststamp
WHILE @@FETCH_STATUS = 0
BEGIN
	declare cursorGamas cursor for
	select stamp
	from stgamaop
	where ststamp = @ststamp
	order by ordem

	open cursorGamas

	fetch next from cursorGamas into @stampgama

	WHILE @@FETCH_STATUS = 0
	BEGIN
		print @ststamp + ' -> ' + @stampgama

		set @newid = NEWID()

		insert into @tabela2
		select top 1 g.ststamp, g.tabela1, g.tabela2, 99, '', '', case when @stampgamaorigem = '' then @origem else @stampgamaorigem end, @newid, 'PROCESSO'
		from stgamaop g
		where g.stamp = @stampgama

		set @stampgamaorigem = @newid

		fetch next from cursorGamas into @stampgama
	END
	close cursorGamas
	deallocate cursorGamas

	fetch next from cursorDados into @origem, @ststamp
END
close cursorDados
deallocate cursorDados

insert into @tabela select * from @tabela2

select *
from @tabela t
where 1 = 1
--order by origem, destino

SET NOCOUNT OFF
