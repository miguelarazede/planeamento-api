select *
from _os_processos
where 1 = 1
    and bostamp = @bostamp
    and isHistory = 0
order by ordem
